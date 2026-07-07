import { useCallback, useRef, useState, type RefObject } from "react";
import clsx from "clsx";
import { Button } from "@heroui/react";

import { MarkdownContent } from "@/components/markdown-content";

type EditorTab = "write" | "preview";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  /** 底部操作区 */
  footer?: React.ReactNode;
  className?: string;
}

interface ToolbarAction {
  label: string;
  title: string;
  prefix: string;
  suffix: string;
  block?: boolean;
  placeholder?: string;
}

const TOOLBAR: ToolbarAction[] = [
  { label: "H", title: "标题", prefix: "## ", suffix: "", block: true },
  { label: "B", title: "粗体", prefix: "**", suffix: "**", placeholder: "粗体" },
  { label: "I", title: "斜体", prefix: "_", suffix: "_", placeholder: "斜体" },
  { label: "<>", title: "代码", prefix: "`", suffix: "`", placeholder: "code" },
  { label: "🔗", title: "链接", prefix: "[", suffix: "](url)", placeholder: "链接文字" },
  { label: "•", title: "无序列表", prefix: "- ", suffix: "", block: true },
  { label: "1.", title: "有序列表", prefix: "1. ", suffix: "", block: true },
  { label: "☑", title: "任务列表", prefix: "- [ ] ", suffix: "", block: true },
  { label: "❝", title: "引用", prefix: "> ", suffix: "", block: true },
  { label: "{ }", title: "代码块", prefix: "```\n", suffix: "\n```", block: true, placeholder: "code" },
];

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
      className="inline-flex h-7 min-w-7 items-center justify-center rounded px-1.5 type-body-small text-subtle hover:bg-[var(--ads-color-background-neutral)] hover:text-foreground"
      title={action.title}
      type="button"
      onClick={() => {
        const el = textareaRef.current;
        if (!el) return;
        const { next, cursorStart, cursorEnd } = applyWrap(
          el,
          action.prefix,
          action.suffix,
          action.placeholder ?? "",
          action.block,
        );
        onChange(next);
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(cursorStart, cursorEnd);
        });
      }}
    >
      <span className={clsx(action.label.length === 1 && "font-semibold")}>{action.label}</span>
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
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<EditorTab>("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const switchTab = useCallback((next: EditorTab) => {
    setTab(next);
  }, []);

  return (
    <div
      className={clsx(
        "overflow-hidden rounded-lg border border-separator bg-surface focus-within:border-[var(--ads-color-brand)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-separator bg-surface-sunken px-2 py-1">
        <div className="flex gap-0.5">
          {(
            [
              { key: "write" as const, label: "写入" },
              { key: "preview" as const, label: "预览" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              className={clsx(
                "rounded-md px-3 py-1.5 type-body-small transition-colors",
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
          <div className="flex flex-wrap items-center gap-0.5">
            {TOOLBAR.map((action) => (
              <ToolbarButton
                key={action.title}
                action={action}
                textareaRef={textareaRef}
                onChange={onChange}
              />
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
        <div className="min-h-[8rem] px-4 py-3" style={{ minHeight }}>
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
