import { describe, expect, it } from "vitest";

import { isOk } from "@/api/client";
import type { ApiResponse } from "@/types/api";

describe("isOk", () => {
  it("returns true only for code 200", () => {
    const ok: ApiResponse = { code: 200, msg: "", data: {} };
    const fail: ApiResponse = { code: 401, msg: "x", data: null };
    expect(isOk(ok)).toBe(true);
    expect(isOk(fail)).toBe(false);
  });
});
