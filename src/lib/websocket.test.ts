import { describe, expect, it } from "vitest";

import { parseWsMessage, wsBaseUrl } from "@/lib/websocket";

describe("websocket helpers", () => {
  it("parseWsMessage parses JSON payloads", () => {
    expect(parseWsMessage('{"action":"ping","data":1}')).toEqual({
      action: "ping",
      data: 1,
    });
    expect(parseWsMessage("not-json")).toBeNull();
  });

  it("wsBaseUrl returns null when unset", () => {
    expect(wsBaseUrl()).toBeNull();
  });
});
