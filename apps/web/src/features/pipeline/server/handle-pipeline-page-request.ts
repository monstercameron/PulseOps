import { z } from "zod";

import {
  type DocumentRecord,
  type DocumentStatus,
} from "@/features/documents/domain/document";
import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import {
  documentStatusListSearchParamSchema,
  matchesDocumentStatusFilter,
} from "@/features/documents/server/document-query-filters";
import {
  type IngestionJob,
  type IngestionJobStatus,
} from "@/features/ingestion/domain/ingestion-job";
import { type IngestionJobRepository } from "@/features/ingestion/repositories/ingestion-job-repository";
import { getDefaultUiMessages } from "@/features/i18n/constants/default-ui-translation-bundles";
import {
  getUiDocumentFamilyLabel,
  getUiSourceLabel,
} from "@/features/i18n/lib/data-labels";
import {
  fallbackPipelinePageData,
  type PipelineFilter,
  type PipelinePageData,
  type PipelinePlaybook,
  type PipelineRun,
  type PipelineRunStep,
  type PipelineSource,
  type PipelineStage,
  type PipelineStat,
} from "@/features/pipeline/constants/pipeline-page-content";

const pipelineSearchParamsSchema = z.object({
  orgId: z.string().min(1),
  status: z.preprocess(
    (value) =>
      typeof value === "string" && value.length > 0 ? value : undefined,
    documentStatusListSearchParamSchema.optional(),
  ),
});

type PipelineDependencies = Readonly<{
  documentRepository: DocumentRepository;
  ingestionJobRepository: IngestionJobRepository;
}>;

type PipelineStatusCounts = Readonly<{
  attention: number;
  extracted: number;
  intake: number;
  parsedOrClassified: number;
  total: number;
}>;

export async function handlePipelinePageRequest(
  request: Request,
  dependencies: PipelineDependencies,
) {
  const url = new URL(request.url);
  const parsedSearchParams = pipelineSearchParamsSchema.safeParse({
    orgId: url.searchParams.get("orgId"),
    status: url.searchParams.get("status"),
  });

  if (!parsedSearchParams.success) {
    if (url.searchParams.get("orgId") === null) {
      return Response.json(
        {
          error: "Missing orgId query parameter.",
        },
        { status: 400 },
      );
    }

    return Response.json(
      {
        error: "Invalid pipeline query parameters.",
      },
      { status: 400 },
    );
  }

  const data = await getPipelinePageData({
    ...dependencies,
    orgId: parsedSearchParams.data.orgId,
    statuses: parsedSearchParams.data.status,
  });

  return Response.json({
    orgId: parsedSearchParams.data.orgId,
    ...data,
  });
}

type GetPipelinePageDataInput = PipelineDependencies &
  Readonly<{
    locale?: string;
    orgId: string;
    statuses?: readonly DocumentStatus[];
  }>;

export async function getPipelinePageData({
  documentRepository,
  ingestionJobRepository,
  locale = "en-US",
  orgId,
  statuses,
}: GetPipelinePageDataInput): Promise<PipelinePageData> {
  const [allDocuments, jobs] = await Promise.all([
    documentRepository.listByOrgId(orgId),
    ingestionJobRepository.listByOrgId(orgId),
  ]);
  const documents = allDocuments.filter((document) =>
    matchesDocumentStatusFilter(document, statuses),
  );

  if (
    allDocuments.length === 0 &&
    jobs.length === 0 &&
    statuses === undefined
  ) {
    return fallbackPipelinePageData;
  }

  const counts = getPipelineStatusCounts(documents);
  const latestJobsByDocumentId = buildLatestJobsByDocumentId(jobs);
  const sources = groupSources(documents, locale);

  return {
    alert: buildPipelineAlert({
      documents,
    }),
    filters: buildPipelineFilters({
      documents: allDocuments,
      statuses,
    }),
    focus: buildPipelineFocus({
      counts,
      documents,
      statuses,
    }),
    playbook: buildPipelinePlaybook(counts),
    rules: fallbackPipelinePageData.rules,
    runs: buildPipelineRuns({
      documents,
      jobsByDocumentId: latestJobsByDocumentId,
      locale,
    }),
    sources,
    stages: buildPipelineStages(counts),
    stats: buildPipelineStats({
      counts,
      documents,
    }),
  };
}

function buildPipelineAlert(
  input: Readonly<{
    documents: readonly DocumentRecord[];
  }>,
): PipelinePageData["alert"] {
  const failedDocuments = input.documents.filter(
    (document) => document.status === "failed",
  );

  if (failedDocuments.length === 0) {
    return null;
  }

  return {
    actionLabel: "Show blocked files",
    description: `${joinDocumentNames(failedDocuments)} stopped before facts could be prepared.`,
    dismissLabel: "Dismiss",
    title: `${failedDocuments.length} file${failedDocuments.length === 1 ? " needs" : "s need"} attention before ${failedDocuments.length === 1 ? "it can" : "they can"} move forward.`,
    tone: "warning",
  };
}

function buildPipelineFilters(
  input: Readonly<{
    documents: readonly DocumentRecord[];
    statuses?: readonly DocumentStatus[];
  }>,
): readonly PipelineFilter[] {
  const counts = getPipelineStatusCounts(input.documents);

  return [
    {
      active: input.statuses === undefined,
      count: counts.total,
      id: "all",
      label: "All files",
    },
    {
      active: matchesExactStatuses(input.statuses, ["failed"]),
      count: counts.attention,
      id: "attention",
      label: "Needs attention",
      queryValue: "failed",
    },
    {
      active: matchesExactStatuses(input.statuses, ["uploaded", "stored"]),
      count: counts.intake,
      id: "intake",
      label: "In intake",
      queryValue: "uploaded,stored",
    },
    {
      active: matchesExactStatuses(input.statuses, ["parsed", "classified"]),
      count: counts.parsedOrClassified,
      id: "review",
      label: "Ready for review",
      queryValue: "parsed,classified",
    },
    {
      active: matchesExactStatuses(input.statuses, ["extracted"]),
      count: counts.extracted,
      id: "ready",
      label: "Facts ready",
      queryValue: "extracted",
    },
  ];
}

function buildPipelineFocus(
  input: Readonly<{
    counts: PipelineStatusCounts;
    documents: readonly DocumentRecord[];
    statuses?: readonly DocumentStatus[];
  }>,
): PipelinePageData["focus"] {
  if (input.documents.length === 0) {
    return input.statuses === undefined
      ? {
          description:
            "Upload a CSV or XLSX file to start the intake path, then use Pipeline to confirm what is blocked, what needs review, and what is ready to support facts.",
          title: "The pipeline is waiting for its first file.",
          tone: "info",
        }
      : {
          description:
            "No files match the current filter. Clear the filter or upload another file to bring activity back into view.",
          title: "Nothing in the current pipeline view needs work.",
          tone: "info",
        };
  }

  if (input.counts.attention > 0) {
    return {
      description: `${input.counts.attention} file${input.counts.attention === 1 ? "" : "s"} are blocked before facts can be prepared. Clear those first so the rest of the workflow stays trustworthy.`,
      title: "The pipeline needs a quick operator pass right now.",
      tone: "warning",
    };
  }

  if (input.counts.parsedOrClassified > 0) {
    return {
      description: `${input.counts.parsedOrClassified} file${input.counts.parsedOrClassified === 1 ? "" : "s"} have finished intake and are ready to leave Pipeline for fact review.`,
      title: "The queue is ready for handoff.",
      tone: "warning",
    };
  }

  if (input.counts.intake > 0) {
    return {
      description: `${input.counts.intake} file${input.counts.intake === 1 ? "" : "s"} are still moving through intake. The pipeline is working, but those files are not ready for review yet.`,
      title: "Files are still moving through intake.",
      tone: "info",
    };
  }

  return {
    description: `${input.counts.extracted} file${input.counts.extracted === 1 ? "" : "s"} have already cleared pipeline checks and can support downstream review and the weekly brief with confidence.`,
    title: "The pipeline is clear.",
    tone: "success",
  };
}

function buildPipelinePlaybook(
  counts: PipelineStatusCounts,
): PipelinePlaybook {
  return {
    description:
      "Use Pipeline to keep files moving, clear anything blocked, and confirm when a file is ready to leave intake.",
    steps: [
      {
        description:
          counts.attention > 0
            ? `${counts.attention} file${counts.attention === 1 ? "" : "s"} are blocked right now. Fix these first so nothing questionable moves downstream.`
            : "No blocked files are holding up the queue right now.",
        id: "playbook_blocked",
        label: "1. Clear blocked files",
        tone: counts.attention > 0 ? "danger" : "success",
      },
      {
        description:
          counts.intake > 0
            ? `${counts.intake} file${counts.intake === 1 ? " is" : "s are"} still moving through intake checks. Wait here until the structure and routing pass cleanly.`
            : "Nothing is stuck in intake. New uploads should move through the first checks quickly.",
        id: "playbook_intake",
        label: "2. Let intake finish",
        tone: counts.intake > 0 ? "warning" : "success",
      },
      {
        description:
          counts.parsedOrClassified > 0
            ? `${counts.parsedOrClassified} file${counts.parsedOrClassified === 1 ? "" : "s"} are ready to leave Pipeline and move into fact review.`
            : counts.extracted > 0
              ? `${counts.extracted} file${counts.extracted === 1 ? "" : "s"} have already cleared Pipeline and are supporting downstream work.`
              : "No files are ready to hand off yet.",
        id: "playbook_handoff",
        label: "3. Hand off clean files",
        tone:
          counts.parsedOrClassified > 0
            ? "warning"
            : counts.extracted > 0
              ? "success"
              : "info",
      },
    ],
    title: "Pipeline owns intake and readiness.",
  };
}

function buildPipelineStages(
  counts: PipelineStatusCounts,
): readonly PipelineStage[] {
  return [
    {
      count: String(counts.intake),
      description:
        "Files that have arrived and are still moving through intake checks.",
      id: "stage_intake",
      label: "In intake",
      tone: counts.intake > 0 ? "info" : "neutral",
    },
    {
      count: String(counts.parsedOrClassified),
      description:
        "Files that have finished intake and are ready to leave Pipeline for fact review.",
      id: "stage_review",
      label: "Ready for review",
      tone: counts.parsedOrClassified > 0 ? "warning" : "neutral",
    },
    {
      count: String(counts.extracted),
      description:
        "Files already cleared for downstream review, cited facts, and the weekly brief.",
      id: "stage_ready",
      label: "Facts ready",
      tone: counts.extracted > 0 ? "success" : "neutral",
    },
    {
      count: String(counts.attention),
      description:
        "Files that stopped and need attention before they can move forward.",
      id: "stage_attention",
      label: "Needs attention",
      tone: counts.attention > 0 ? "danger" : "neutral",
    },
  ];
}

function buildPipelineStats(
  input: Readonly<{
    counts: PipelineStatusCounts;
    documents: readonly DocumentRecord[];
  }>,
): readonly PipelineStat[] {
  return [
    {
      detail: "Files currently visible on this pipeline surface.",
      label: "Files in scope",
      value: String(input.counts.total),
    },
    {
      detail: "Blocked files should be fixed before anything moves downstream.",
      label: "Blocked now",
      value: String(input.counts.attention),
    },
    {
      detail:
        "Files already cleared for downstream review, cited facts, and the weekly brief.",
      label: "Facts ready",
      value: String(input.counts.extracted),
    },
    {
      detail:
        "Average confidence across files that already reached review or better.",
      label: "Average confidence",
      value: getAverageConfidence(input.documents),
    },
  ];
}

function buildPipelineRuns(
  input: Readonly<{
    documents: readonly DocumentRecord[];
    jobsByDocumentId: ReadonlyMap<string, IngestionJob>;
    locale: string;
  }>,
): readonly PipelineRun[] {
  const messages = getDefaultUiMessages(input.locale);

  return input.documents
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 6)
    .map((document) => {
      const latestJob = input.jobsByDocumentId.get(document.id);

      return {
        confidenceLabel:
          document.classificationConfidenceScore !== undefined
            ? document.classificationConfidenceScore.toFixed(2)
            : "--",
        detail: buildRunDetail(document, latestJob),
        documentType: getUiDocumentFamilyLabel(
          messages,
          document.suggestedDocumentFamily,
        ),
        durationLabel:
          latestJob === undefined
            ? "--"
            : getDurationLabel(
                latestJob.createdAt,
                latestJob.completedAt ?? latestJob.lastUpdatedAt,
              ),
        fileName: document.fileName,
        id: document.id,
        nextStepLabel: buildRunNextStep(document.status),
        outcomeLabel: buildRunOutcomeLabel(document.status),
        outcomeTone: buildRunOutcomeTone(document.status),
        recordsLabel: "1 file",
        sourceLabel: getUiSourceLabel(messages, document.source),
        steps: buildRunSteps(document.status, latestJob?.status),
        timeLabel: new Intl.DateTimeFormat(input.locale, {
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(document.updatedAt)),
      };
    });
}

function groupSources(
  documents: readonly DocumentRecord[],
  locale: string,
): readonly PipelineSource[] {
  const messages = getDefaultUiMessages(locale);
  const sourceOrder = ["upload", "email", "api"] as const;
  const sources: PipelineSource[] = [];

  sourceOrder.forEach((source) => {
    const matchingDocuments = documents.filter(
      (document) => document.source === source,
    );

    if (matchingDocuments.length === 0) {
      return;
    }

    const latestDocument = matchingDocuments
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
    const failedCount = matchingDocuments.filter(
      (document) => document.status === "failed",
    ).length;
    const typeChips = Array.from(
      new Set(
        matchingDocuments
          .map((document) =>
            getUiDocumentFamilyLabel(
              messages,
              document.suggestedDocumentFamily,
            ),
          )
          .slice(0, 4),
      ),
    );

    sources.push({
      actionLabel:
        failedCount > 0
          ? "Review files"
          : source === "upload"
            ? messages.pipelinePage.sourceActions.upload
            : messages.pipelinePage.sourceActions.configure,
      detailRows: [
        {
          label: source === "upload" ? "Last upload" : "Last activity",
          value: new Intl.DateTimeFormat(locale, {
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            month: "short",
          }).format(new Date(latestDocument.updatedAt)),
        },
        {
          label: source === "upload" ? "This week" : "In scope",
          value: `${matchingDocuments.length} file${matchingDocuments.length === 1 ? "" : "s"}`,
        },
      ],
      healthLabel:
        failedCount > 0
          ? "Needs attention"
          : source === "upload"
            ? "Active"
            : "Connected",
      healthTone: failedCount > 0 ? "warning" : "success",
      id: `source_${source}`,
      subtitle: buildSourceSubtitle(source),
      title: buildSourceTitle(source, locale),
      typeChips,
    });
  });

  return sources;
}

function buildSourceTitle(source: "api" | "email" | "upload", locale: string) {
  const messages = getDefaultUiMessages(locale);

  if (source === "api") {
    return "Connected API feeds";
  }

  if (source === "email") {
    return getUiSourceLabel(messages, "email");
  }

  return getUiSourceLabel(messages, "upload");
}

function buildSourceSubtitle(source: "api" | "email" | "upload") {
  if (source === "api") {
    return "Connected system data that is already landing in this workspace.";
  }

  if (source === "email") {
    return "Email attachments and receipts that are already entering review.";
  }

  return "Manual CSV / XLSX intake for the first field-service MVP workflow.";
}

function getPipelineStatusCounts(
  documents: readonly DocumentRecord[],
): PipelineStatusCounts {
  return {
    attention: documents.filter((document) => document.status === "failed")
      .length,
    extracted: documents.filter((document) => document.status === "extracted")
      .length,
    intake: documents.filter(
      (document) =>
        document.status === "uploaded" || document.status === "stored",
    ).length,
    parsedOrClassified: documents.filter(
      (document) =>
        document.status === "parsed" || document.status === "classified",
    ).length,
    total: documents.length,
  };
}

function buildLatestJobsByDocumentId(
  jobs: readonly IngestionJob[],
): ReadonlyMap<string, IngestionJob> {
  const latestJobsByDocumentId = new Map<string, IngestionJob>();

  jobs
    .slice()
    .sort((left, right) =>
      right.lastUpdatedAt.localeCompare(left.lastUpdatedAt),
    )
    .forEach((job) => {
      if (!latestJobsByDocumentId.has(job.documentId)) {
        latestJobsByDocumentId.set(job.documentId, job);
      }
    });

  return latestJobsByDocumentId;
}

function buildRunOutcomeLabel(status: DocumentStatus) {
  if (status === "failed") {
    return "Needs attention";
  }

  if (status === "parsed" || status === "classified") {
    return "Ready for review";
  }

  if (status === "extracted") {
    return "Facts ready";
  }

  return "In intake";
}

function buildRunOutcomeTone(
  status: DocumentStatus,
): PipelineRun["outcomeTone"] {
  if (status === "failed") {
    return "danger";
  }

  if (status === "parsed" || status === "classified") {
    return "warning";
  }

  if (status === "extracted") {
    return "success";
  }

  return "info";
}

function buildRunDetail(document: DocumentRecord, latestJob?: IngestionJob) {
  if (document.status === "failed") {
    const failureReason = humanizeFailureReason(latestJob?.failureReason);

    return latestJob?.failureReason?.trim().length
      ? `The file stopped before facts were prepared. ${failureReason}.`
      : "The file stopped before facts were prepared, so someone should inspect it in Pipeline.";
  }

  if (document.status === "parsed" || document.status === "classified") {
    return "The structure and document family look right. A quick review keeps the downstream facts trustworthy.";
  }

  if (document.status === "extracted") {
    return "This file has cleared pipeline checks and is ready to support downstream review and the weekly brief.";
  }

  if (latestJob?.status === "parsing" || latestJob?.status === "queued") {
    return "The file is still moving through intake checks before review can begin.";
  }

  return "The file has been received and is still moving through the early intake steps.";
}

function humanizeFailureReason(reason?: string) {
  if (reason === undefined || reason.trim().length === 0) {
    return "The import did not finish cleanly";
  }

  const normalizedReason = reason.toLowerCase();

  if (
    normalizedReason.includes("end of central directory") ||
    normalizedReason.includes("zip") ||
    normalizedReason.includes("xlsx")
  ) {
    return "The spreadsheet file could not be opened cleanly. It may be damaged or saved with the wrong file type";
  }

  if (
    normalizedReason.includes("worker") ||
    normalizedReason.includes("cannot find module") ||
    normalizedReason.includes("imported from") ||
    normalizedReason.includes("node_modules")
  ) {
    return "The file could not be read cleanly during intake. Upload a fresh export or save it again before retrying";
  }

  if (
    normalizedReason.includes("parse") ||
    normalizedReason.includes("layout") ||
    normalizedReason.includes("column")
  ) {
    return "The file structure did not match the import format we expect";
  }

  if (normalizedReason.includes("password") || normalizedReason.includes("encrypted")) {
    return "The file is protected and could not be opened for intake";
  }

  if (normalizedReason.includes("manual stop")) {
    return "The intake run was stopped before the facts were prepared";
  }

  return "The import did not finish cleanly";
}

function buildRunNextStep(status: DocumentStatus) {
  if (status === "failed") {
    return "Next: inspect the file in Pipeline, fix the source file, and upload it again if needed.";
  }

  if (status === "parsed" || status === "classified") {
    return "Next: hand this file off for fact review so the visible details can be confirmed.";
  }

  if (status === "extracted") {
    return "Next: use this file in downstream review or let it feed the weekly brief.";
  }

  return "Next: wait for intake checks to finish, then review the file details.";
}

function buildRunSteps(
  documentStatus: DocumentStatus,
  jobStatus?: IngestionJobStatus,
): readonly PipelineRunStep[] {
  const currentStepIndex = getCurrentRunStepIndex(documentStatus, jobStatus);
  const lastCompleteIndex =
    documentStatus === "extracted" ? 3 : currentStepIndex - 1;

  return [
    {
      label: "Received",
      state: lastCompleteIndex >= 0 ? "complete" : "current",
    },
    {
      label: "Checked",
      state:
        currentStepIndex === 1
          ? "current"
          : lastCompleteIndex >= 1
            ? "complete"
            : "upcoming",
    },
    {
      label: "Review",
      state:
        currentStepIndex === 2
          ? "current"
          : lastCompleteIndex >= 2
            ? "complete"
            : "upcoming",
    },
    {
      label: "Facts ready",
      state:
        currentStepIndex === 3
          ? "current"
          : lastCompleteIndex >= 3
            ? "complete"
            : "upcoming",
    },
  ];
}

function getCurrentRunStepIndex(
  documentStatus: DocumentStatus,
  jobStatus?: IngestionJobStatus,
) {
  if (documentStatus === "failed") {
    if (jobStatus === "classifying") {
      return 2;
    }

    return 1;
  }

  if (documentStatus === "parsed" || documentStatus === "classified") {
    return 2;
  }

  if (documentStatus === "extracted") {
    return 3;
  }

  if (documentStatus === "stored" || jobStatus === "parsing") {
    return 1;
  }

  return 0;
}

function getAverageConfidence(documents: readonly DocumentRecord[]) {
  const confidenceScores = documents
    .map((document) => document.classificationConfidenceScore)
    .filter((score): score is number => score !== undefined);

  if (confidenceScores.length === 0) {
    return "--";
  }

  return (
    confidenceScores.reduce((total, score) => total + score, 0) /
    confidenceScores.length
  ).toFixed(2);
}

function getDurationLabel(startedAt: string, completedAt: string) {
  const durationMilliseconds =
    new Date(completedAt).getTime() - new Date(startedAt).getTime();

  if (durationMilliseconds <= 0) {
    return "0.0s";
  }

  return `${(durationMilliseconds / 1000).toFixed(1)}s`;
}

function joinDocumentNames(documents: readonly DocumentRecord[]) {
  if (documents.length === 0) {
    return "No files";
  }

  if (documents.length === 1) {
    return documents[0].fileName;
  }

  if (documents.length === 2) {
    return `${documents[0].fileName} and ${documents[1].fileName}`;
  }

  return `${documents[0].fileName}, ${documents[1].fileName}, and ${documents.length - 2} more`;
}

function matchesExactStatuses(
  currentStatuses: readonly DocumentStatus[] | undefined,
  expectedStatuses: readonly DocumentStatus[],
) {
  if (currentStatuses === undefined) {
    return false;
  }

  if (currentStatuses.length !== expectedStatuses.length) {
    return false;
  }

  return expectedStatuses.every((status) => currentStatuses.includes(status));
}
