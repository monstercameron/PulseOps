import { BlogEditorPage } from "@/features/blog/components/blog-editor-page";

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default async function EditPostRoute({ params }: PageProps) {
  const { postId } = await params;
  return <BlogEditorPage postId={postId} />;
}
