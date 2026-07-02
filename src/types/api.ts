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
}

export interface Organization {
  code: string;
  name: string;
  logo?: string;
}

export interface MenuItem {
  id: number;
  title: string;
  url: string;
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
