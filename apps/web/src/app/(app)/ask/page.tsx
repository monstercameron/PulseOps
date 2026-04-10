import { AskPage } from "@/features/ask/components/ask-page";
import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { listAskHistoryThreads } from "@/features/query/server/handle-ask-history-request";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export default async function Ask() {
  const initialHistory = await listAskHistoryThreads({
    orgId: DEFAULT_WORKSPACE.orgId,
    savedQuestionRepository: localIngestionRuntime.savedQuestionRepository,
  });

  return (
    <AskPage
      initialHistory={initialHistory}
      orgId={DEFAULT_WORKSPACE.orgId}
    />
  );
}
