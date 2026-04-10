import { type Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

type AskMessageRichTextProps = Readonly<{
  content: string;
  role: "assistant" | "user";
}>;

const richTextComponents: Components = {
  a: ({ children, href }) => (
    <a
      className="font-semibold underline underline-offset-2"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-current/25 pl-4 italic">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const languageMatch = /language-([\w-]+)/.exec(className ?? "");
    const isBlock = languageMatch !== null;

    if (isBlock) {
      return (
        <code className="font-mono text-[12.5px] leading-6">
          {children}
        </code>
      );
    }

    return (
      <code className="rounded bg-current/10 px-1.5 py-0.5 font-mono text-[12.5px]">
        {children}
      </code>
    );
  },
  h1: ({ children }) => (
    <h1 className="text-[1.5rem] font-semibold leading-tight tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[1.25rem] font-semibold leading-tight tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[1.05rem] font-semibold leading-tight">
      {children}
    </h3>
  ),
  hr: () => <hr className="border-current/15" />,
  li: ({ children }) => <li className="ml-5">{children}</li>,
  ol: ({ children }) => (
    <ol className="list-decimal space-y-1 pl-5">{children}</ol>
  ),
  p: ({ children }) => <p>{children}</p>,
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-[10px] bg-current/10 p-3 font-mono text-[12.5px] leading-6">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-[12.5px]">
        {children}
      </table>
    </div>
  ),
  td: ({ children }) => (
    <td className="border border-current/15 px-2 py-1.5 align-top">
      {children}
    </td>
  ),
  th: ({ children }) => (
    <th className="border border-current/15 px-2 py-1.5 font-semibold">
      {children}
    </th>
  ),
  ul: ({ children }) => (
    <ul className="list-disc space-y-1 pl-5">{children}</ul>
  ),
};

export function AskMessageRichText({
  content,
  role,
}: AskMessageRichTextProps) {
  return (
    <div
      className={[
        "space-y-3 break-words",
        role === "assistant" ? "text-foreground" : "text-white",
      ].join(" ")}
    >
      <ReactMarkdown
        components={richTextComponents}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        remarkPlugins={[remarkGfm, remarkBreaks]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
