import {
  INFO_TYPE_CANVAS,
  INFO_TYPE_CANVAS_META,
  INFO_TYPE_FORM,
  INFO_TYPE_FORM_RESPONSE,
  INFO_TYPE_OVERVIEW_META,
  INFO_TYPE_WIKI,
} from "@/lib/project-info-types";
import type { ProjectInfoBlock } from "@/types/api";

/** 摘要 DIY 画布列数（12 列栅格，类似 Bootstrap） */
export const CANVAS_GRID_COLS = 12;
/** 每行高度（px），用于拖拽吸附与 min-height 计算 */
export const CANVAS_ROW_HEIGHT = 72;
export const CANVAS_MIN_W = 2;
export const CANVAS_MAX_W = 12;
export const CANVAS_MIN_H = 1;
export const CANVAS_MAX_H = 8;

export interface CanvasBlockLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  bg?: string;
}

export interface CanvasBlockData {
  content: string;
  layout: CanvasBlockLayout;
}

export interface ParsedCanvasBlock {
  code: string;
  title: string;
  content: string;
  layout: CanvasBlockLayout;
  /** 未迁移的旧版信息块，需自动排布 */
  legacy?: boolean;
}

export interface CanvasMeta {
  cols: number;
  rowHeight: number;
}

export const DEFAULT_CANVAS_META: CanvasMeta = {
  cols: CANVAS_GRID_COLS,
  rowHeight: CANVAS_ROW_HEIGHT,
};

const OVERVIEW_EXCLUDED_TYPES = new Set([
  INFO_TYPE_WIKI,
  INFO_TYPE_FORM,
  INFO_TYPE_FORM_RESPONSE,
  INFO_TYPE_CANVAS_META,
  INFO_TYPE_OVERVIEW_META,
]);

export function isOverviewCanvasCandidate(block: ProjectInfoBlock): boolean {
  const desc = block.description ?? "";
  if (OVERVIEW_EXCLUDED_TYPES.has(desc)) return false;
  if (desc === INFO_TYPE_CANVAS) return true;
  if (!desc.startsWith("hero:")) return true;
  return false;
}

export function filterOverviewCanvasBlocks(blocks: ProjectInfoBlock[]): ProjectInfoBlock[] {
  return blocks.filter(isOverviewCanvasCandidate);
}

export function parseCanvasBlock(block: ProjectInfoBlock): ParsedCanvasBlock | null {
  if (!isOverviewCanvasCandidate(block)) return null;

  if (block.description === INFO_TYPE_CANVAS) {
    try {
      const data = JSON.parse(block.value ?? "{}") as Partial<CanvasBlockData>;
      const layout = normalizeLayout(data.layout);
      return {
        code: block.code,
        title: block.name,
        content: data.content ?? "",
        layout,
        legacy: false,
      };
    } catch {
      return {
        code: block.code,
        title: block.name,
        content: block.value ?? "",
        layout: defaultLayout(0, 0),
        legacy: false,
      };
    }
  }

  return {
    code: block.code,
    title: block.name,
    content: block.value || block.description || "",
    layout: defaultLayout(0, 0),
    legacy: true,
  };
}

export function parseCanvasBlocks(blocks: ProjectInfoBlock[]): ParsedCanvasBlock[] {
  const raw = filterOverviewCanvasBlocks(blocks)
    .map(parseCanvasBlock)
    .filter((b): b is ParsedCanvasBlock => b != null);

  return autoPlaceLegacyLayouts(raw);
}

export function serializeCanvasBlock(title: string, data: CanvasBlockData) {
  return {
    name: title.trim(),
    value: JSON.stringify({
      content: data.content,
      layout: normalizeLayout(data.layout),
    }),
    description: INFO_TYPE_CANVAS,
  };
}

export function parseCanvasMeta(blocks: ProjectInfoBlock[]): CanvasMeta {
  const meta = blocks.find((b) => b.description === INFO_TYPE_CANVAS_META);
  if (!meta?.value) return DEFAULT_CANVAS_META;
  try {
    const parsed = JSON.parse(meta.value) as Partial<CanvasMeta>;
    return {
      cols: clamp(parsed.cols ?? CANVAS_GRID_COLS, 4, 24),
      rowHeight: clamp(parsed.rowHeight ?? CANVAS_ROW_HEIGHT, 48, 160),
    };
  } catch {
    return DEFAULT_CANVAS_META;
  }
}

export function serializeCanvasMeta(meta: CanvasMeta): string {
  return JSON.stringify({
    cols: clamp(meta.cols, 4, 24),
    rowHeight: clamp(meta.rowHeight, 48, 160),
  });
}

export function nextAvailableSlot(
  blocks: ParsedCanvasBlock[],
  w: number,
  h: number,
  cols = CANVAS_GRID_COLS,
): { x: number; y: number } {
  const width = clamp(w, CANVAS_MIN_W, cols);
  const height = clamp(h, CANVAS_MIN_H, CANVAS_MAX_H);
  let y = 0;
  for (let guard = 0; guard < 200; guard++) {
    for (let x = 0; x <= cols - width; x++) {
      if (!collides(blocks, x, y, width, height)) {
        return { x, y };
      }
    }
    y++;
  }
  return { x: 0, y };
}

export function canvasMinHeight(blocks: ParsedCanvasBlock[], rowHeight = CANVAS_ROW_HEIGHT): number {
  if (!blocks.length) return rowHeight * 3;
  const maxRow = blocks.reduce((max, b) => Math.max(max, b.layout.y + b.layout.h), 0);
  return Math.max(rowHeight * 3, maxRow * rowHeight + rowHeight);
}

function autoPlaceLegacyLayouts(blocks: ParsedCanvasBlock[]): ParsedCanvasBlock[] {
  const placed: ParsedCanvasBlock[] = [];
  for (const block of blocks) {
    const hasCollision = collides(
      placed,
      block.layout.x,
      block.layout.y,
      block.layout.w,
      block.layout.h,
    );
    if (block.legacy || hasCollision) {
      const slot = nextAvailableSlot(placed, block.layout.w, block.layout.h);
      placed.push({ ...block, layout: { ...block.layout, ...slot }, legacy: false });
    } else {
      placed.push(block);
    }
  }
  return placed;
}

function collides(
  blocks: ParsedCanvasBlock[],
  x: number,
  y: number,
  w: number,
  h: number,
  ignoreCode?: string,
): boolean {
  return blocks.some((b) => {
    if (ignoreCode && b.code === ignoreCode) return false;
    const a = b.layout;
    return x < a.x + a.w && x + w > a.x && y < a.y + a.h && y + h > a.y;
  });
}

function defaultLayout(x: number, y: number): CanvasBlockLayout {
  return { x, y, w: 6, h: 3, bg: "#ffffff" };
}

function normalizeLayout(layout?: Partial<CanvasBlockLayout>): CanvasBlockLayout {
  return {
    x: clamp(layout?.x ?? 0, 0, CANVAS_GRID_COLS - 1),
    y: Math.max(0, layout?.y ?? 0),
    w: clamp(layout?.w ?? 6, CANVAS_MIN_W, CANVAS_MAX_W),
    h: clamp(layout?.h ?? 3, CANVAS_MIN_H, CANVAS_MAX_H),
    bg: layout?.bg?.trim() || "#ffffff",
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function clampLayout(
  layout: CanvasBlockLayout,
  cols = CANVAS_GRID_COLS,
): CanvasBlockLayout {
  const w = clamp(layout.w, CANVAS_MIN_W, cols);
  const x = clamp(layout.x, 0, cols - w);
  return {
    ...layout,
    x,
    w,
    y: Math.max(0, layout.y),
    h: clamp(layout.h, CANVAS_MIN_H, CANVAS_MAX_H),
  };
}
