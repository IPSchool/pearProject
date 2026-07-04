export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

export interface TokenList {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExp: number;
}

export interface Member {
  code: string;
  name: string;
  avatar?: string;
  email?: string;
  mobile?: string;
  realname?: string;
  description?: string;
  organization_code?: string;
  position?: string;
  department?: string;
}

export interface Organization {
  code: string;
  name: string;
  logo?: string;
  avatar?: string;
  personal?: number;
}

export interface MenuItem {
  id: number;
  title: string;
  url: string;
  file_path?: string;
  icon?: string;
  children?: MenuItem[];
}

export interface LoginResult {
  tokenList: TokenList;
  member: Member;
  menuList: MenuItem[];
  organizationList?: Organization[];
}

export interface ProjectSummary {
  code: string;
  name: string;
  description?: string;
  cover?: string;
  archive?: number;
  deleted?: number;
  collected?: number;
}

export interface ProjectDetail extends ProjectSummary {
  owner_name?: string;
  owner_avatar?: string;
  organization_code?: string;
  create_time?: string;
}

export interface TaskStage {
  code: string;
  name: string;
  sort?: number;
  project_code?: string;
}

export interface TaskItem {
  code: string;
  name: string;
  stage_code?: string;
  project_code?: string;
  priText?: string;
  statusText?: string;
  done?: number;
  description?: string;
  end_time?: string;
  assign_to?: string;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
  password2: string;
  mobile: string;
  captcha: string;
}

export interface TaskLogItem {
  id: number;
  content: string;
  remark?: string;
  is_comment?: number;
  create_time: string;
  member_name?: string;
  member_avatar?: string;
}

export interface TaskWorkTimeItem {
  id?: number;
  code?: string;
  num?: number;
  work_time?: number;
  content?: string;
  begin_time?: string;
  end_time?: string;
}

export interface TaskTagItem {
  code: string;
  name: string;
  color?: string;
  project_code?: string;
}

export interface ProjectInfoBlock {
  code: string;
  name: string;
  value?: string;
  description?: string;
  sort?: number;
  project_code?: string;
}

export interface TaskStagesTemplate {
  code: string;
  name: string;
  description?: string;
}

export interface ProjectMember {
  code: string;
  name: string;
  email?: string;
  avatar?: string;
  is_owner?: number;
}

export interface NotificationItem {
  id: number;
  title: string;
  content: string;
  type: string;
  is_read: number;
  create_time: string;
}

export interface NoReadsSummary {
  total: number;
  totalSum?: { notice: number; message: number; task: number };
}

export interface OrganizationItem {
  code: string;
  name: string;
  description?: string;
  address?: string;
  personal?: number;
  owner_code?: string;
  create_time?: string;
}

export interface DepartmentItem {
  code: string;
  name: string;
  organization_code?: string;
  pcode?: string;
  hasNext?: boolean;
}

export interface AuthRole {
  id: string;
  title: string;
  desc?: string;
  status?: number;
  is_default?: number;
  create_at?: string;
  canDelete?: boolean;
}

export interface AuthNode {
  title: string;
  node: string;
  key: string;
  checked?: boolean;
  children?: AuthNode[];
}

export interface AccountItem {
  id?: number | string;
  code: string;
  name: string;
  email?: string;
  mobile?: string;
  avatar?: string;
  status?: number;
  is_owner?: number;
  authorize?: number | string;
  departments?: string;
  description?: string;
  position?: string;
  member_code?: string;
  membar_account_code?: string;
}

export interface InviteSearchMember {
  accountCode: string;
  name: string;
  email?: string;
  avatar?: string;
  joined?: boolean;
}
