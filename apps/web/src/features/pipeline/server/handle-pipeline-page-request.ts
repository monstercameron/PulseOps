import { z } from "zod";

import { type DocumentStatus } from "@/features/documents/domain/document";
import {
  fallbackPipelinePageData,
  type PipelinePageData,
  type PipelineRun,
  type PipelineSource,
} from "@/features/pipeline/constants/pipeline-page-content";
import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import {
  documentStatusListSearchParamSchema,
  matchesDocumentStatusFilter,
} from "@/features/documents/server/document-query-filters";
import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { type IngestionJobRepository } from "@/features/ingestion/repositories/ingestion-job-repository";
import { getDefaultUiMessages } from "@/features/i18n/constants/default-ui-translation-bundles";
import {
  getUiDocumentFamilyLabel,
  getUiSourceLabel,
  getUiStatusLabel,
} from "@/features/i18n/lib/data-labels";

const pipelineSearchParamsSchema = z.object({
  orgId: z.string().min(1),
  status: z.preprocess(
    (value) => (typeof value === "string" && value.length > 0 ? value : undefined),
    documentStatusListSearchParamSchema.optional(),
  ),
});

type PipelineDependencies = Readonly<{
  documentRepository: DocumentRepository;
  ingestionJobRepository: IngestionJobRepository;
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
  const messages = getDefaultUiMessages(locale);
  const [allDocuments, jobs] = await Promise.all([
    documentRepository.listByOrgId(orgId),
    ingestionJobRepository.listByOrgId(orgId),
  ]);
  const documents = allDocuments.filter((document) =>
    matchesDocumentStatusFilter(document, statuses),
  );
  const matchingDocumentIds = new Set(documents.map((document) => document.id));
  const filteredJobs =
    statuses === undefined
      ? jobs
      : jobs.filter((job) => matchingDocumentIds.has(job.documentId));

  if (allDocuments.length === 0 && jobs.length === 0 && statuses === undefined) {
    return fallbackPipelinePageData;
  }

  const failedDocuments = documents.filter((document) => document.status === "failed");
  const groupedSources = groupSources(documents, locale);
  const runs = filteredJobs
    .slice()
    .sort((left, right) => right.lastUpdatedAt.localeCompare(left.lastUpdatedAt))
    .slice(0, 6)
    .map((job) => {
      const relatedDocument = documents.find((document) => document.id === job.documentId);

      return {
        confidenceLabel:
          relatedDocument?.classificationConfidenceScore !== undefined
            ? relatedDocument.classificationConfidenceScore.toFixed(2)
            : "--",
        documentType: getUiDocumentFamilyLabel(
          messages,
          relatedDocument?.suggestedDocumentFamily,
        ),
        durationLabel: getDurationLabel(job.createdAt, job.completedAt ?? job.lastUpdatedAt),
        id: job.id,
        outcomeLabel: buildJobOutcomeLabel(job.status),
        outcomeTone: buildJobOutcomeTone(job.status),
        recordsLabel: "1",
        sourceLabel: getUiSourceLabel(messages, relatedDocument?.source ?? "upload"),
        timeLabel: new Intl.DateTimeFormat(locale, {
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(job.lastUpdatedAt)),
      } satisfies PipelineRun;
    });

  return {
    alert:
      failedDocuments.length > 0
        ? {
            actionLabel: messages.pipelinePage.sourceActions.viewFailedRecords,
            description: `${failedDocuments.map((document) => document.fileName).join(", ")} require review before they can move downstream.`,
            dismissLabel: messages.pipelinePage.dismissAction,
            title: `${DEFAULT_WORKSPACE.name} has failed document intake.`,
            tone: "warning",
          }
        : null,
    rules: fallbackPipelinePageData.rules,
    runs,
    sources: groupedSources,
    stats: [
      {
        detail: `${groupedSources.filter((source) => source.healthTone === "success").length} stable source groups`,
        label: "Sources",
        value: String(groupedSources.length),
      },
      {
        detail: "Stored across the current workspace",
        label: "Records today",
        value: String(documents.length),
      },
      {
        detail: `${filteredJobs.filter((job) => job.status === "completed").length} completed`,
        label: "Pipeline runs",
        value: String(filteredJobs.length),
      },
      {
        detail: "Based on classified documents",
        label: "Average confidence",
        value: getAverageConfidence(documents),
      },
    ],
  };
}

function groupSources(
  documents: Awaited<ReturnType<DocumentRepository["listByOrgId"]>>,
  locale: string,
): readonly PipelineSource[] {
  const messages = getDefaultUiMessages(locale);
  const sourceOrder = ["api", "email", "upload"] as const;
  const sources: PipelineSource[] = [];

  sourceOrder.forEach((source) => {
    const matchingDocuments = documents.filter((document) => document.source === source);

    if (matchingDocuments.length === 0) {
      return;
    }

    const latestDocument = matchingDocuments
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
    const failedCount = matchingDocuments.filter((document) => document.status === "failed").length;
    const typeChips = Array.from(
      new Set(
        matchingDocuments
          .map((document) =>
            getUiDocumentFamilyLabel(messages, document.suggestedDocumentFamily),
          )
          .slice(0, 4),
      ),
    );

    sources.push({
      actionLabel:
        source === "email" && failedCount > 0
          ? messages.pipelinePage.sourceActions.investigate
          : source === "upload"
            ? messages.pipelinePage.sourceActions.upload
            : messages.pipelinePage.sourceActions.configure,
      detailRows: [
        {
          label: "Last sync",
          value: new Intl.DateTimeFormat(locale, {
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            month: "short",
          }).format(new Date(latestDocument.updatedAt)),
        },
        {
          label: source === "upload" ? "This week" : "Today",
          value: `${matchingDocuments.length} document${matchingDocuments.length === 1 ? "" : "s"}`,
        },
      ],
      healthLabel:
        failedCount > 0
          ? getUiStatusLabel(messages, "needs-review")
          : source === "upload"
            ? "Manual review"
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
    return "Connected API sources";
  }

  if (source === "email") {
    return getUiSourceLabel(messages, "email");
  }

  return getUiSourceLabel(messages, "upload");
}

function buildSourceSubtitle(source: "api" | "email" | "upload") {
  if (source === "api") {
    return "API-connected operational systems";
  }

  if (source === "email") {
    return "Email intake for invoice attachments and vendor receipts";
  }

  return "CSV / XLSX review queue before extraction";
}

function buildJobOutcomeLabel(status: string) {
  if (status === "completed") {
    return "OK";
  }

  if (status === "failed") {
    return "Failed";
  }

  return "Partial";
}

function buildJobOutcomeTone(
  status: string,
): PipelineRun["outcomeTone"] {
  if (status === "completed") {
    return "success";
  }

  if (status === "failed") {
    return "danger";
  }

  return "warning";
}

function getAverageConfidence(
  documents: Awaited<ReturnType<DocumentRepository["listByOrgId"]>>,
) {
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
