import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Button, Card, InputGroup, Label, Modal, Spinner, TextField } from "@heroui/react";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as projectInfoApi from "@/api/projectInfo";
import { MarkdownContent } from "@/components/markdown-content";
import { MarkdownEditor, MarkdownEditorActions } from "@/components/markdown-editor";
import { INFO_TYPE_CANVAS_META } from "@/lib/project-info-types";
import {
  CANVAS_GRID_COLS,
  CANVAS_MAX_H,
  CANVAS_MAX_W,
  CANVAS_MIN_H,
  CANVAS_MIN_W,
  CANVAS_ROW_HEIGHT,
  canvasMinHeight,
  clampLayout,
  nextAvailableSlot,
  parseCanvasBlocks,
  serializeCanvasBlock,
  serializeCanvasMeta,
  type CanvasBlockLayout,
  type ParsedCanvasBlock,
} from "@/lib/overview-canvas";
import type { ProjectInfoBlock } from "@/types/api";

interface OverviewCanvasProps {
  projectCode: string;
  blocks: ProjectInfoBlock[];
  onChanged: () => Promise<void>;
}

interface BlockEditorState {
  code: string | null;
  title: string;
  content: string;
  layout: CanvasBlockLayout;
  isNew: boolean;
}

const DEFAULT_BG = "#ffffff";

function layoutStyle(layout: CanvasBlockLayout, rowHeight: number) {
  return {
    gridColumn: `${layout.x + 1} / span ${layout.w}`,
    gridRow: `${layout.y + 1} / span ${layout.h}`,
    backgroundColor: layout.bg || DEFAULT_BG,
    minHeight: layout.h * rowHeight,
  } as const;
}

function CanvasBlockCard({
  block,
  editMode,
  rowHeight,
  onEdit,
  onDelete,
}: {
  block: ParsedCanvasBlock;
  editMode: boolean;
  rowHeight: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.code,
    disabled: !editMode,
  });

  const style = {
    ...layoutStyle(block.layout, rowHeight),
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-separator/80 shadow-sm transition-shadow",
        editMode && "ring-1 ring-transparent hover:ring-[var(--ads-color-brand)]",
        isDragging && "shadow-lg",
      )}
      style={style}
    >
      {editMode ? (
        <div className="flex items-center justify-between gap-2 border-b border-separator/60 bg-black/[0.03] px-3 py-1.5">
          <button
            className="flex min-w-0 flex-1 cursor-grab items-center gap-2 text-left active:cursor-grabbing"
            type="button"
            {...attributes}
            {...listeners}
          >
            <GripIcon className="size-4 shrink-0 text-subtlest" />
            <span className="type-body-small truncate font-medium">{block.title}</span>
            <span className="type-hint shrink-0">
              {block.layout.w}×{block.layout.h}
            </span>
          </button>
          <div className="flex shrink-0 gap-1">
            <button
              className="rounded px-2 py-0.5 type-hint hover:bg-[var(--ads-color-background-neutral)]"
              type="button"
              onClick={onEdit}
            >
              编辑
            </button>
            <button
              className="rounded px-2 py-0.5 type-hint text-danger hover:bg-[var(--ads-color-background-neutral)]"
              type="button"
              onClick={onDelete}
            >
              删除
            </button>
          </div>
        </div>
      ) : (
        <div className="border-b border-separator/40 px-4 py-2.5">
          <p className="type-body font-medium">{block.title}</p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
        {block.content ? (
          <MarkdownContent source={block.content} />
        ) : (
          <p className="type-hint text-subtlest">暂无内容</p>
        )}
      </div>
    </div>
  );
}

function GripIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="currentColor" viewBox="0 0 16 16">
      <circle cx="4" cy="4" r="1.25" />
      <circle cx="4" cy="8" r="1.25" />
      <circle cx="4" cy="12" r="1.25" />
      <circle cx="10" cy="4" r="1.25" />
      <circle cx="10" cy="8" r="1.25" />
      <circle cx="10" cy="12" r="1.25" />
    </svg>
  );
}

export function OverviewCanvas({ projectCode, blocks, onChanged }: OverviewCanvasProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [parsed, setParsed] = useState<ParsedCanvasBlock[]>(() => parseCanvasBlocks(blocks));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<BlockEditorState | null>(null);

  const rowHeight = CANVAS_ROW_HEIGHT;
  const cols = CANVAS_GRID_COLS;

  useEffect(() => {
    setParsed(parseCanvasBlocks(blocks));
  }, [blocks]);

  const minHeight = useMemo(() => canvasMinHeight(parsed, rowHeight), [parsed, rowHeight]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const persistBlock = useCallback(
    async (code: string, title: string, content: string, layout: CanvasBlockLayout) => {
      const payload = serializeCanvasBlock(title, { content, layout: clampLayout(layout, cols) });
      await projectInfoApi.editProjectInfoBlock(code, payload.name, payload.value, payload.description);
    },
    [cols],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, delta } = event;
      const grid = gridRef.current;
      if (!grid || (!delta.x && !delta.y)) return;

      const block = parsed.find((b) => b.code === active.id);
      if (!block) return;

      const colWidth = grid.clientWidth / cols;
      const dx = Math.round(delta.x / colWidth);
      const dy = Math.round(delta.y / rowHeight);
      const next = clampLayout(
        {
          ...block.layout,
          x: block.layout.x + dx,
          y: block.layout.y + dy,
        },
        cols,
      );

      setParsed((prev) =>
        prev.map((b) => (b.code === block.code ? { ...b, layout: next } : b)),
      );

      setSaving(true);
      setError(null);
      try {
        await persistBlock(block.code, block.title, block.content, next);
        await onChanged();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存布局失败");
        setParsed(parseCanvasBlocks(blocks));
      } finally {
        setSaving(false);
      }
    },
    [blocks, cols, onChanged, parsed, persistBlock, rowHeight],
  );

  function defaultBlockTitle(existing: ParsedCanvasBlock[]): string {
    const base = "新信息块";
    const used = new Set(existing.map((b) => b.title));
    if (!used.has(base)) return base;
    let i = 2;
    while (used.has(`${base} ${i}`)) i++;
    return `${base} ${i}`;
  }

  function openCreate() {
    const slot = nextAvailableSlot(parsed, 4, 3, cols);
    setEditor({
      code: null,
      title: defaultBlockTitle(parsed),
      content: "",
      layout: { x: slot.x, y: slot.y, w: 4, h: 3, bg: DEFAULT_BG },
      isNew: true,
    });
  }

  function openEdit(block: ParsedCanvasBlock) {
    setEditor({
      code: block.code,
      title: block.title,
      content: block.content,
      layout: { ...block.layout },
      isNew: false,
    });
  }

  async function saveEditor() {
    if (!editor || !editor.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const layout = clampLayout(editor.layout, cols);
      const payload = serializeCanvasBlock(editor.title, {
        content: editor.content,
        layout,
      });

      if (editor.isNew) {
        await projectInfoApi.createProjectInfoBlock(
          projectCode,
          payload.name,
          payload.value,
          payload.description,
        );
      } else if (editor.code) {
        await projectInfoApi.editProjectInfoBlock(
          editor.code,
          payload.name,
          payload.value,
          payload.description,
        );
      }

      setEditor(null);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlock(code: string) {
    if (!confirm("确定删除此信息块？")) return;
    setSaving(true);
    setError(null);
    try {
      await projectInfoApi.deleteProjectInfoBlock(code);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setSaving(false);
    }
  }

  async function ensureCanvasMeta() {
    const hasMeta = blocks.some((b) => b.description === INFO_TYPE_CANVAS_META);
    if (hasMeta) return;
    await projectInfoApi.createProjectInfoBlock(
      projectCode,
      "__canvas_meta__",
      serializeCanvasMeta({ cols, rowHeight }),
      INFO_TYPE_CANVAS_META,
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="type-heading-small">DIY 信息画布</h3>
          <p className="type-hint mt-1 max-w-2xl text-subtle">
            页面按 <strong>{cols} 列</strong>栅格切分，每行高约 {rowHeight}px。
            可拖动信息块调整位置，并自定义宽高与背景色；内容支持 Markdown。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saving ? <Spinner size="sm" /> : null}
          <Button
            variant={editMode ? "primary" : "secondary"}
            onPress={() => {
              setEditMode((v) => !v);
              void ensureCanvasMeta();
            }}
          >
            {editMode ? "完成编辑" : "编辑画布"}
          </Button>
          <Button onPress={openCreate}>新建信息块</Button>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Card className="relative overflow-hidden p-3 md:p-4">
        {editMode ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-3 md:inset-4 grid gap-2 opacity-40"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridAutoRows: `${rowHeight}px`,
            }}
          >
            {Array.from({ length: cols * Math.ceil(minHeight / rowHeight) }).map((_, i) => (
              <div key={i} className="rounded border border-dashed border-separator" />
            ))}
          </div>
        ) : null}

        <DndContext sensors={sensors} onDragEnd={(e) => void handleDragEnd(e)}>
          <div
            ref={gridRef}
            className="relative grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridAutoRows: `${rowHeight}px`,
              minHeight,
            }}
          >
            {parsed.map((block) => (
              <CanvasBlockCard
                key={block.code}
                block={block}
                editMode={editMode}
                rowHeight={rowHeight}
                onDelete={() => void deleteBlock(block.code)}
                onEdit={() => openEdit(block)}
              />
            ))}
          </div>
        </DndContext>

        {!parsed.length ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center">
            <div>
              <p className="type-body text-subtle">暂无信息块</p>
              <p className="type-hint mt-1 text-subtlest">
                点击「新建信息块」开始 DIY，或开启「编辑画布」拖动已有块
              </p>
            </div>
          </div>
        ) : null}
      </Card>

      <Modal.Backdrop isOpen={editor != null} onOpenChange={(open) => !open && setEditor(null)}>
        <Modal.Container>
          <Modal.Dialog className="max-w-2xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{editor?.isNew ? "新建信息块" : "编辑信息块"}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              <TextField isRequired name="blockTitle">
                <Label>标题</Label>
                <InputGroup>
                  <InputGroup.Input
                    value={editor?.title ?? ""}
                    onChange={(e) =>
                      setEditor((s) => (s ? { ...s, title: e.target.value } : s))
                    }
                  />
                </InputGroup>
              </TextField>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <NumberField
                  label="宽度（列）"
                  max={CANVAS_MAX_W}
                  min={CANVAS_MIN_W}
                  value={editor?.layout.w ?? 4}
                  onChange={(w) =>
                    setEditor((s) =>
                      s ? { ...s, layout: clampLayout({ ...s.layout, w }, cols) } : s,
                    )
                  }
                />
                <NumberField
                  label="高度（行）"
                  max={CANVAS_MAX_H}
                  min={CANVAS_MIN_H}
                  value={editor?.layout.h ?? 3}
                  onChange={(h) =>
                    setEditor((s) => (s ? { ...s, layout: { ...s.layout, h } } : s))
                  }
                />
                <NumberField
                  label="列位置 X"
                  max={cols - 1}
                  min={0}
                  value={editor?.layout.x ?? 0}
                  onChange={(x) =>
                    setEditor((s) =>
                      s ? { ...s, layout: clampLayout({ ...s.layout, x }, cols) } : s,
                    )
                  }
                />
                <NumberField
                  label="行位置 Y"
                  min={0}
                  value={editor?.layout.y ?? 0}
                  onChange={(y) =>
                    setEditor((s) => (s ? { ...s, layout: { ...s.layout, y } } : s))
                  }
                />
              </div>

              <div>
                <Label>背景颜色</Label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    className="size-10 cursor-pointer rounded border border-separator bg-transparent"
                    type="color"
                    value={editor?.layout.bg ?? DEFAULT_BG}
                    onChange={(e) =>
                      setEditor((s) =>
                        s ? { ...s, layout: { ...s.layout, bg: e.target.value } } : s,
                      )
                    }
                  />
                  <InputGroup className="max-w-[8rem]">
                    <InputGroup.Input
                      value={editor?.layout.bg ?? DEFAULT_BG}
                      onChange={(e) =>
                        setEditor((s) =>
                          s ? { ...s, layout: { ...s.layout, bg: e.target.value } } : s,
                        )
                      }
                    />
                  </InputGroup>
                </div>
              </div>

              <div>
                <Label>内容（Markdown）</Label>
                <MarkdownEditor
                  className="mt-1.5"
                  minHeight="14rem"
                  placeholder="支持 **粗体**、列表、链接、代码块等 Markdown 语法…"
                  value={editor?.content ?? ""}
                  onChange={(content) =>
                    setEditor((s) => (s ? { ...s, content } : s))
                  }
                />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <MarkdownEditorActions
                submitting={saving}
                onCancel={() => setEditor(null)}
                onSave={() => void saveEditor()}
              />
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </section>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
}) {
  return (
    <TextField name={label}>
      <Label>{label}</Label>
      <InputGroup>
        <InputGroup.Input
          max={max}
          min={min}
          type="number"
          value={String(value)}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            let v = Math.round(n);
            if (min != null) v = Math.max(min, v);
            if (max != null) v = Math.min(max, v);
            onChange(v);
          }}
        />
      </InputGroup>
    </TextField>
  );
}
