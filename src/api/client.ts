import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { apiBaseUrl } from "@/config/env";
import type { ApiResponse } from "@/types/api";
import { useAuthStore } from "@/stores/auth";

function joinUrl(path: string): string {
  const base = apiBaseUrl();
  const normalized = path.replace(/^\//, "");
  return base ? `${base}/${normalized}` : `/${normalized}`;
}

export const http = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { tokenList, currentOrganization } = useAuthStore.getState();

  config.url = joinUrl(config.url ?? "");

  if (config.method === "post" && config.data && typeof config.data === "object") {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(config.data)) {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    }
    config.data = params.toString();
  }

  if (tokenList?.accessToken) {
    config.headers.Authorization = `${tokenList.tokenType} ${tokenList.accessToken}`;
  }
  if (currentOrganization?.code) {
    config.headers.organizationCode = currentOrganization.code;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    const body = error.response?.data;
    if (body?.code === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(body ?? error);
  },
);

export function isOk<T>(res: ApiResponse<T>): res is ApiResponse<T> & { code: 200 } {
  return res.code === 200;
}

export async function post<T>(
  url: string,
  data?: Record<string, string | number | undefined>,
): Promise<ApiResponse<T>> {
  const response = await http.post<ApiResponse<T>>(url, data);
  const body = response.data;
  body.code = Number(body.code);
  return body;
}
