import { INFO_TYPE_OVERVIEW_META } from "@/lib/project-info-types";
import type { ProjectInfoBlock } from "@/types/api";

export interface OverviewSettings {
  /** 摘要页顶部是否显示封面横幅 */
  showCover: boolean;
}

export const DEFAULT_OVERVIEW_SETTINGS: OverviewSettings = {
  showCover: true,
};

const META_BLOCK_NAME = "__overview_meta__";

export function parseOverviewSettings(blocks: ProjectInfoBlock[]): OverviewSettings {
  const meta = blocks.find((b) => b.description === INFO_TYPE_OVERVIEW_META);
  if (!meta?.value) return DEFAULT_OVERVIEW_SETTINGS;
  try {
    const parsed = JSON.parse(meta.value) as Partial<OverviewSettings>;
    return { showCover: parsed.showCover !== false };
  } catch {
    return DEFAULT_OVERVIEW_SETTINGS;
  }
}

export function serializeOverviewSettings(settings: OverviewSettings): string {
  return JSON.stringify({ showCover: settings.showCover !== false });
}

export async function saveOverviewSettings(
  projectCode: string,
  blocks: ProjectInfoBlock[],
  settings: OverviewSettings,
  api: {
    createProjectInfoBlock: typeof import("@/api/projectInfo").createProjectInfoBlock;
    editProjectInfoBlock: typeof import("@/api/projectInfo").editProjectInfoBlock;
  },
) {
  const value = serializeOverviewSettings(settings);
  const existing = blocks.find((b) => b.description === INFO_TYPE_OVERVIEW_META);
  if (existing) {
    await api.editProjectInfoBlock(existing.code, META_BLOCK_NAME, value, INFO_TYPE_OVERVIEW_META);
  } else {
    await api.createProjectInfoBlock(
      projectCode,
      META_BLOCK_NAME,
      value,
      INFO_TYPE_OVERVIEW_META,
    );
  }
}
