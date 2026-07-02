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
  currentOrganization: Organization | null;
  login: (account: string, passwordMd5: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrateFromLogin: (payload: LoginResult) => void;
  setOrganization: (org: Organization) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      logged: false,
      member: null,
      tokenList: null,
      menuList: [],
      currentOrganization: null,

      hydrateFromLogin(payload) {
        const org =
          payload.organizationList?.[0] ?? get().currentOrganization ?? null;
        set({
          logged: true,
          member: payload.member,
          tokenList: payload.tokenList,
          menuList: payload.menuList ?? [],
          currentOrganization: org,
        });
      },

      async login(account, passwordMd5) {
        const data = await authApi.login(account, passwordMd5);
        get().hydrateFromLogin(data);
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
            currentOrganization: null,
          });
        }
      },

      setOrganization(org) {
        set({ currentOrganization: org });
      },
    }),
    {
      name: "pear-hero-auth",
      partialize: (state) => ({
        logged: state.logged,
        member: state.member,
        tokenList: state.tokenList,
        menuList: state.menuList,
        currentOrganization: state.currentOrganization,
      }),
    },
  ),
);
