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
