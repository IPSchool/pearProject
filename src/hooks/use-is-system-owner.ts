import { useAuthStore } from "@/stores/auth";

/** 当前组织拥有者（实例级系统配置管理员） */
export function useIsSystemOwner(): boolean {
  return useAuthStore((s) => (s.member?.is_owner ?? 0) === 1);
}
