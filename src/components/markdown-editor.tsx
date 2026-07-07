import { useCallback, useRef, useState, type RefObject } from "react";
import clsx from "clsx";
import { Button } from "@heroui/react";

import { MarkdownContent } from "@/components/markdown-content";

export type MarkdownEditorTab = "write" | "preview";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  /** 底部操作区 */
  footer?: React.ReactNode;
  className?: string;
  /** 受控 Tab；不传则组件内部管理 */
  tab?: MarkdownEditorTab;
  defaultTab?: MarkdownEditorTab;
  onTabChange?: (tab: MarkdownEditorTab) => void;
}

interface ToolbarAction {
  label: string;
  title: string;
  prefix: string;
  suffix: string;
  block?: boolean;
  placeholder?: string;
  kind?: "wrap" | "indent" | "outdent";
}

const TOOLBAR: ToolbarAction[] = [
  { label: "H1", title: "一级标题", prefix: "# ", suffix: "", block: true, kind: "wrap" },
  { label: "H2", title: "二级标题", prefix: "## ", suffix: "", block: true, kind: "wrap" },
  { label: "H3", title: "三级标题", prefix: "### ", suffix: "", block: true, kind: "wrap" },
  { label: "B", title: "粗体", prefix: "**", suffix: "**", placeholder: "粗体", kind: "wrap" },
  { label: "I", title: "斜体", prefix: "_", suffix: "_", placeholder: "斜体", kind: "wrap" },
  { label: "S", title: "删除线", prefix: "~~", suffix: "~~", placeholder: "删除线", kind: "wrap" },
  { label: "<>", title: "行内代码", prefix: "`", suffix: "`", placeholder: "code", kind: "wrap" },
  { label: "🔗", title: "链接", prefix: "[", suffix: "](url)", placeholder: "链接文字", kind: "wrap" },
  { label: "•", title: "无序列表", prefix: "- ", suffix: "", block: true, kind: "wrap" },
  { label: "1.", title: "有序列表", prefix: "1. ", suffix: "", block: true, kind: "wrap" },
  { label: "☑", title: "任务列表", prefix: "- [ ] ", suffix: "", block: true, kind: "wrap" },
  { label: "❝", title: "引用", prefix: "> ", suffix: "", block: true, kind: "wrap" },
  { label: "{ }", title: "代码块", prefix: "```\n", suffix: "\n```", block: true, placeholder: "code", kind: "wrap" },
  { label: "⇥", title: "增加缩进", prefix: "", suffix: "", kind: "indent" },
  { label: "⇤", title: "减少缩进", prefix: "", suffix: "", kind: "outdent" },
];

function getLineBlockRange(value: string, selectionStart: number, selectionEnd: number) {
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEndRaw = value.indexOf("\n", selectionEnd);
  const lineEnd = lineEndRaw === -1 ? value.length : lineEndRaw;
  return { lineStart, lineEnd };
}

function applyWrap(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string,
  placeholder: string,
  block?: boolean,
) {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  const insert = selected || placeholder;

  let next: string;
  let cursorStart: number;
  let cursorEnd: number;

  if (block && selectionStart === selectionEnd) {
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    cursorStart = lineStart + prefix.length;
    cursorEnd = cursorStart;
  } else {
    next =
      value.slice(0, selectionStart) + prefix + insert + suffix + value.slice(selectionEnd);
    cursorStart = selectionStart + prefix.length;
    cursorEnd = cursorStart + insert.length;
  }

  return { next, cursorStart, cursorEnd };
}

function applyIndent(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  outdent: boolean,
) {
  const { lineStart, lineEnd } = getLineBlockRange(value, selectionStart, selectionEnd);
  const block = value.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  const indentUnit = "  ";

  const newLines = lines.map((line) => {
    if (outdent) {
      if (line.startsWith(indentUnit)) return line.slice(indentUnit.length);
      if (line.startsWith("\t")) return line.slice(1);
      return line;
    }
    return indentUnit + line;
  });

  const nextBlock = newLines.join("\n");
  const next = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);
  const delta = nextBlock.length - block.length;
  return {
    next,
    cursorStart: selectionStart + (outdent ? 0 : indentUnit.length),
    cursorEnd: selectionEnd + delta,
  };
}

function ToolbarButton({
  action,
  textareaRef,
  onChange,
}: {
  action: ToolbarAction;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
}) {
  return (
    <button
      className={clsx(
        "inline-flex h-7 min-w-7 items-center justify-center rounded px-1.5 type-body-small text-subtle",
        "hover:bg-[var(--ads-color-background-neutral)] hover:text-foreground",
        action.label.length === 1 && "font-semibold",
      )}
      title={action.title}
      type="button"
      onClick={() => {
        const el = textareaRef.current;
        if (!el) return;
        let result: { next: string; cursorStart: number; cursorEnd: number };
        if (action.kind === "indent") {
          result = applyIndent(el.value, el.selectionStart, el.selectionEnd, false);
        } else if (action.kind === "outdent") {
          result = applyIndent(el.value, el.selectionStart, el.selectionEnd, true);
        } else {
          result = applyWrap(
            el,
            action.prefix,
            action.suffix,
            action.placeholder ?? "",
            action.block,
          );
        }
        onChange(result.next);
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(result.cursorStart, result.cursorEnd);
        });
      }}
    >
      {action.label}
    </button>
  );
}

/** GitHub Issue 风格 Markdown 编辑器：写入 / 预览 Tab + 工具栏 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = "在此输入 Markdown…",
  minHeight = "12rem",
  footer,
  className,
  tab: controlledTab,
  defaultTab = "write",
  onTabChange,
}: MarkdownEditorProps) {
  const [internalTab, setInternalTab] = useState<MarkdownEditorTab>(defaultTab);
  const tab = controlledTab ?? internalTab;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const switchTab = useCallback(
    (next: MarkdownEditorTab) => {
      if (controlledTab === undefined) {
        setInternalTab(next);
      }
      onTabChange?.(next);
    },
    [controlledTab, onTabChange],
  );

  return (
    <div
      className={clsx(
        "overflow-hidden rounded-lg border border-separator bg-surface focus-within:border-[var(--ads-color-brand)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-separator bg-surface-sunken px-2 py-1">
        <div className="flex gap-0.5 rounded-md bg-[var(--ads-color-background-neutral)]/40 p-0.5">
          {(
            [
              { key: "write" as const, label: "写入" },
              { key: "preview" as const, label: "预览" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              className={clsx(
                "rounded px-3 py-1.5 type-body-small transition-colors",
                tab === t.key
                  ? "bg-surface font-medium text-foreground shadow-sm"
                  : "text-subtle hover:text-foreground",
              )}
              type="button"
              onClick={() => switchTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "write" ? (
          <div className="flex max-w-full flex-wrap items-center gap-0.5 overflow-x-auto">
            {TOOLBAR.map((action, index) => (
              <span key={action.title} className="contents">
                {index === 7 || index === 12 ? (
                  <span aria-hidden className="mx-0.5 h-4 w-px shrink-0 bg-separator" />
                ) : null}
                <ToolbarButton action={action} textareaRef={textareaRef} onChange={onChange} />
              </span>
            ))}
          </div>
        ) : (
          <span className="type-hint px-2">Markdown 预览</span>
        )}
      </div>

      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          className="block w-full resize-y border-0 bg-surface px-4 py-3 font-mono text-[0.8125rem] leading-relaxed outline-none"
          placeholder={placeholder}
          style={{ minHeight }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="min-h-[8rem] overflow-auto px-4 py-3" style={{ minHeight }}>
          <MarkdownContent emptyHint="暂无内容可预览" source={value} />
        </div>
      )}

      {footer ? (
        <div className="flex flex-wrap gap-2 border-t border-separator bg-surface-sunken px-3 py-2">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

interface MarkdownEditorActionsProps {
  submitting?: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function MarkdownEditorActions({ submitting, onSave, onCancel }: MarkdownEditorActionsProps) {
  return (
    <>
      <Button isPending={submitting} size="sm" onPress={onSave}>
        保存
      </Button>
      <Button size="sm" variant="tertiary" onPress={onCancel}>
        取消
      </Button>
    </>
  );
}
