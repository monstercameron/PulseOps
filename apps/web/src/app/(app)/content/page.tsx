import { BlogAdminPage } from "@/features/blog/components/blog-admin-page";
import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";

export default function ContentRoute() {
  return <BlogAdminPage orgId={DEFAULT_WORKSPACE.orgId} />;
}
