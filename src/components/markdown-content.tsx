import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { stripLegacyHtmlImages } from "@/config/assets";

/** 判断是否为旧版富文本 HTML 描述 */
export function isHtmlDescription(source: string | null | undefined): boolean {
  if (!source?.trim()) return false;
  return /^\s*</.test(source) && /<(?:p|div|br|a|img|span|ul|ol|li|h[1-6])\b/i.test(source);
}

interface MarkdownContentProps {
  source: string;
  /** 空内容占位文案 */
  emptyHint?: string;
  className?: string;
}

/** GitHub 风格 Markdown 渲染（GFM：表格、任务列表、删除线等） */
export function MarkdownContent({ source, emptyHint, className }: MarkdownContentProps) {
  if (!source?.trim()) {
    return emptyHint ? <p className="type-hint">{emptyHint}</p> : null;
  }

  if (isHtmlDescription(source)) {
    return (
      <div
        className={`markdown-prose markdown-prose--html ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: stripLegacyHtmlImages(source) }}
      />
    );
  }

  return (
    <div className={`markdown-prose ${className ?? ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
