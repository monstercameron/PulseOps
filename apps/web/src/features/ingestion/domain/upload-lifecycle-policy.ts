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
    retainSourceFile?: boolean;
  }>,
): UploadLifecyclePolicy {
  const resolvedSource = documentSourceSchema.parse(source);
  const basePolicy = lifecyclePolicyBySource[resolvedSource];

  if (options?.retainSourceFile === false) {
    return {
      ...basePolicy,
      retentionPolicyKey: `${basePolicy.retentionPolicyKey}${rawUploadPurgeSuffix}`,
    };
  }

  return basePolicy;
}

export function shouldRetainRawUpload(retentionPolicyKey?: string): boolean {
  if (retentionPolicyKey === undefined) {
    return true;
  }

  return !retentionPolicyKey.endsWith(rawUploadPurgeSuffix);
}
