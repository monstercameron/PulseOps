import {
  documentSourceSchema,
  type DocumentSource,
} from "@/features/documents/domain/document";

type UploadLifecyclePolicy = {
  archiveAfterDays: number;
  retentionPolicyKey: string;
};

const lifecyclePolicyBySource: Record<DocumentSource, UploadLifecyclePolicy> = {
  api: {
    archiveAfterDays: 90,
    retentionPolicyKey: "api-hot-90d",
  },
  email: {
    archiveAfterDays: 45,
    retentionPolicyKey: "email-hot-45d",
  },
  upload: {
    archiveAfterDays: 30,
    retentionPolicyKey: "manual-upload-hot-30d",
  },
};

const rawUploadPurgeSuffix = "-purge-source";

export function resolveUploadLifecyclePolicy(
  source: DocumentSource,
  options?: Readonly<{
    archiveAfterDays?: number;
    retainSourceFile?: boolean;
  }>,
): UploadLifecyclePolicy {
  const resolvedSource = documentSourceSchema.parse(source);
  const basePolicy = lifecyclePolicyBySource[resolvedSource];
  const archiveAfterDays = options?.archiveAfterDays ?? basePolicy.archiveAfterDays;

  if (!Number.isInteger(archiveAfterDays) || archiveAfterDays <= 0) {
    throw new Error("Upload lifecycle policy requires a positive archive window.");
  }

  const sourceKeyPrefix =
    resolvedSource === "upload" ? "manual-upload" : resolvedSource;
  const retentionPolicyKey =
    archiveAfterDays === basePolicy.archiveAfterDays
      ? basePolicy.retentionPolicyKey
      : `${sourceKeyPrefix}-hot-${archiveAfterDays}d`;

  if (options?.retainSourceFile === false) {
    return {
      archiveAfterDays,
      retentionPolicyKey: `${retentionPolicyKey}${rawUploadPurgeSuffix}`,
    };
  }

  return {
    archiveAfterDays,
    retentionPolicyKey,
  };
}

export function shouldRetainRawUpload(retentionPolicyKey?: string): boolean {
  if (retentionPolicyKey === undefined) {
    return true;
  }

  return !retentionPolicyKey.endsWith(rawUploadPurgeSuffix);
}
