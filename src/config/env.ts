const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

/** Dev uses Vite proxy `/api`; production uses VITE_API_URL. */
export function apiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return "/api";
  }
  return (apiUrl ?? "").replace(/\/$/, "");
}

export const appTitle =
  (import.meta.env.VITE_APP_TITLE as string | undefined) ?? "PearProject";
