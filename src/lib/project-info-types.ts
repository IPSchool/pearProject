/** projectInfo.description 用于区分块类型（Legacy 表无 type 字段） */
export const INFO_TYPE_WIKI = "hero:wiki";
export const INFO_TYPE_FORM = "hero:form";
export const INFO_TYPE_FORM_RESPONSE = "hero:form_response";
export const INFO_TYPE_CANVAS = "hero:canvas";
export const INFO_TYPE_CANVAS_META = "hero:canvas_meta";
export const INFO_TYPE_OVERVIEW_META = "hero:overview_meta";

/** 非摘要 DIY 画布使用的类型前缀 */
export const HERO_INFO_PREFIX = "hero:";

export function isHeroTypedBlock(description?: string): boolean {
  return Boolean(description?.startsWith(HERO_INFO_PREFIX));
}

export const INFO_TYPE_SURVEY = INFO_TYPE_FORM;
export const INFO_TYPE_SURVEY_RESPONSE = INFO_TYPE_FORM_RESPONSE;

export type SurveyFieldType = "text" | "textarea" | "radio" | "yesno";

export interface ProjectFormField {
  id: string;
  label: string;
  required?: boolean;
  type?: SurveyFieldType;
  /** radio 选项 */
  options?: string[];
  placeholder?: string;
}

export interface ProjectFormDefinition {
  title: string;
  /** 问卷用途说明 */
  description?: string;
  purpose?: "requirement" | "judgment" | "general";
  fields: ProjectFormField[];
}

export interface ProjectFormResponse {
  formCode: string;
  formTitle: string;
  answers: Record<string, string>;
  submittedAt: string;
  submitterName?: string;
  submitterCode?: string;
}

export function parseFormDefinition(value?: string): ProjectFormDefinition | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as ProjectFormDefinition;
  } catch {
    return null;
  }
}

export function parseFormResponse(value?: string): ProjectFormResponse | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as ProjectFormResponse;
  } catch {
    return null;
  }
}
