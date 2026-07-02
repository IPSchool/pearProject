import { create } from "zustand";
import { persist } from "zustand/middleware";

import * as authApi from "@/api/auth";
import type {
  LoginResult,
  Member,
  MenuItem,
  Organization,
  TokenList,
} from "@/types/api";

interface AuthState {
  logged: boolean;
  member: Member | null;
  tokenList: TokenList | null;
  menuList: MenuItem[];
  organizationList: Organization[];
  currentOrganization: Organization | null;
  login: (account: string, passwordMd5: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMenu: () => Promise<void>;
  switchOrganization: (organizationCode: string) => Promise<void>;
  hydrateFromLogin: (payload: LoginResult) => void;
  updateMember: (member: Partial<Member>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      logged: false,
      member: null,
      tokenList: null,
      menuList: [],
      organizationList: [],
      currentOrganization: null,

      hydrateFromLogin(payload) {
        const orgs = payload.organizationList ?? [];
        const orgCode = payload.member.organization_code;
        const current =
          orgs.find((o) => o.code === orgCode) ?? orgs[0] ?? get().currentOrganization;
        set({
          logged: true,
          member: payload.member,
          tokenList: payload.tokenList,
          menuList: payload.menuList ?? [],
          organizationList: orgs,
          currentOrganization: current ?? null,
        });
      },

      updateMember(partial) {
        const member = get().member;
        if (member) {
          set({ member: { ...member, ...partial } });
        }
      },

      async login(account, passwordMd5) {
        const data = await authApi.login(account, passwordMd5);
        get().hydrateFromLogin(data);
        await get().refreshMenu();
      },

      async refreshMenu() {
        const menuList = await authApi.fetchMenu();
        set({ menuList });
      },

      async switchOrganization(organizationCode) {
        const data = await authApi.changeOrganization(organizationCode);
        const org = get().organizationList.find((o) => o.code === organizationCode);
        set({
          menuList: data.menuList ?? [],
          member: data.member ?? get().member,
          currentOrganization: org ?? { code: organizationCode, name: organizationCode },
        });
      },

      async logout() {
        try {
          if (get().logged) {
            await authApi.logout();
          }
        } finally {
          set({
            logged: false,
            member: null,
            tokenList: null,
            menuList: [],
            organizationList: [],
            currentOrganization: null,
          });
        }
      },
    }),
    {
      name: "pear-hero-auth",
      partialize: (state) => ({
        logged: state.logged,
        member: state.member,
        tokenList: state.tokenList,
        menuList: state.menuList,
        organizationList: state.organizationList,
        currentOrganization: state.currentOrganization,
      }),
    },
  ),
);
