import {
  documentSourceSchema,
  type DocumentSource,
} from "@/features/documents/domain/document";

type UploadLifecyclePolicy = {
  archiveAfterDays: number;
  retentionPolicyKey: string;
};

const lifecyclePolicyBySource: Record<
  DocumentSource,
  UploadLifecyclePolicy
> = {
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

export function resolveUploadLifecyclePolicy(
  source: DocumentSource,
): UploadLifecyclePolicy {
  return lifecyclePolicyBySource[documentSourceSchema.parse(source)];
}
