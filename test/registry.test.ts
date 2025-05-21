import { describe, expect, it, vi, beforeEach } from "vitest";

describe("registryProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("when sendFetch success, called debug", async () => {
    const consoleMock = vi.fn();
    vi.doMock("../src/_utils", () => {
      return {
        sendFetch: vi.fn().mockResolvedValueOnce({
          status: 200,
          statusText: "ok",
          json: vi.fn().mockResolvedValueOnce({
            tar: "test.tar",
            name: "test",
          }),
        }),
        debug: consoleMock,
      };
    });
    const { registryProvider } = await import("../src/registry");

    const actual = registryProvider("test");
    await actual("test", {});

    expect(consoleMock).toHaveBeenCalledOnce();
  });

  it("sendFetch result status is 404, throw Warning", async () => {
    vi.doMock("../src/_utils", () => {
      return {
        sendFetch: vi.fn().mockResolvedValueOnce({
          status: 404,
          statusText: "Not Found",
        }),
      };
    });
    const { registryProvider } = await import("../src/registry");

    const actual = registryProvider("test");

    expect(actual("test", {})).rejects.toThrow(
      "Failed to download test template info from test/test.json: 404 Not Found",
    );
  });

  it("sendFetch result status is 404, throw Warning", async () => {
    vi.doMock("../src/_utils", () => {
      return {
        sendFetch: vi.fn().mockResolvedValueOnce({
          status: 200,
          statusText: "ok",
          json: vi.fn().mockResolvedValueOnce({}),
        }),
      };
    });
    const { registryProvider } = await import("../src/registry");

    const actual = registryProvider("test");

    expect(actual("test", {})).rejects.toThrow(
      "Invalid template info from test/test.json. name or tar fields are missing!",
    );
  });
});
