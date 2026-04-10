import { z } from "zod";

import { type DashboardPageData } from "@/features/dashboard/constants/dashboard-page-content";
import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";

const signalsSearchParamsSchema = z.object({
  orgId: z.string().min(1),
});

type SignalsDependencies = Readonly<{
  documentRepository: DocumentRepository;
  factRepository: FactRepository;
}>;

export async function handleSignalsRequest(
  request: Request,
  dependencies: SignalsDependencies,
) {
  const url = new URL(request.url);
  const parsedSearchParams = signalsSearchParamsSchema.safeParse({
    orgId: url.searchParams.get("orgId"),
  });

  if (!parsedSearchParams.success) {
    return Response.json(
      {
        error: "Missing orgId query parameter.",
      },
      { status: 400 },
    );
  }

  const signals = await listSignals({
    documentRepository: dependencies.documentRepository,
    factRepository: dependencies.factRepository,
    orgId: parsedSearchParams.data.orgId,
  });

  return Response.json(
    {
      orgId: parsedSearchParams.data.orgId,
      signals,
    },
    { status: 200 },
  );
}

export async function listSignals(input: Readonly<{
  documentRepository: DocumentRepository;
  factRepository: FactRepository;
  orgId: string;
}>): Promise<DashboardPageData["signals"]> {
  const [documents, facts] = await Promise.all([
    input.documentRepository.listByOrgId(input.orgId),
    input.factRepository.listByOrgId(input.orgId),
  ]);

  return buildSignalsFromWorkspaceData({
    documents,
    facts,
  });
}

export function buildSignalsFromWorkspaceData(input: Readonly<{
  documents: Awaited<ReturnType<DocumentRepository["listByOrgId"]>>;
  facts: Awaited<ReturnType<FactRepository["listByOrgId"]>>;
}>): DashboardPageData["signals"] {
  const { documents, facts } = input;
  const failedCount = documents.filter((document) => document.status === "failed").length;
  const extractedCount = documents.filter((document) => document.status === "extracted").length;
  const emailCount = documents.filter((document) => document.source === "email").length;
  const apiCount = documents.filter((document) => document.source === "api").length;

  return [
    {
      detail: `${failedCount} document${failedCount === 1 ? "" : "s"} currently blocked.`,
      label: "Pipeline risk",
      tone: failedCount > 0 ? "danger" : "success",
      value: failedCount > 0 ? String(failedCount) : "Clear",
    },
    {
      detail: `${extractedCount} extracted document${extractedCount === 1 ? "" : "s"} feeding downstream surfaces.`,
      label: "Pack readiness",
      tone: extractedCount > 0 ? "success" : "warning",
      value: `${extractedCount}`,
    },
    {
      detail: `${facts.length} total facts available for query and recommendation surfaces.`,
      label: "Fact coverage",
      tone: facts.length > 0 ? "info" : "warning",
      value: `${facts.length}`,
    },
    {
      detail: `${emailCount} recent email document${emailCount === 1 ? "" : "s"} in scope.`,
      label: "Email intake",
      tone: "warning",
      value: `${emailCount}`,
    },
    {
      detail: `${apiCount} API-sourced document${apiCount === 1 ? "" : "s"} processed.`,
      label: "Connected sources",
      tone: "info",
      value: `${apiCount}`,
    },
  ];
}
