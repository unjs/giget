import { afterEach, describe, expect, it, vi } from "vitest";
import { retryDelayFor, sendFetch } from "../src/_utils.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

function response(status: number, headers: Record<string, string> = {}) {
  return new Response(status === 204 ? undefined : "body", { status, headers });
}

/** Replies with each given result in turn, and records how many calls were made. */
function stubFetch(...results: Array<Response | Error>) {
  const calls: string[] = [];
  const fetchMock = vi.fn((url: string) => {
    const result = results[calls.length] ?? results.at(-1)!;
    calls.push(url);
    return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

describe("retryDelayFor", () => {
  const base = 500;
  const tests = [
    { name: "backs off exponentially without a header", attempt: 0, expected: 500 },
    { name: "doubles on the next attempt", attempt: 1, expected: 1000 },
    { name: "doubles again", attempt: 2, expected: 2000 },
    {
      name: "honours Retry-After in seconds",
      attempt: 0,
      headers: { "retry-after": "12" },
      expected: 12_000,
    },
    {
      name: "prefers Retry-After over the backoff",
      attempt: 3,
      headers: { "retry-after": "1" },
      expected: 1000,
    },
    {
      name: "caps a large Retry-After",
      attempt: 0,
      headers: { "retry-after": "86400" },
      expected: 60_000,
    },
    {
      name: "caps the backoff too",
      attempt: 30,
      expected: 60_000,
    },
    {
      name: "falls back to the backoff for an unparseable Retry-After",
      attempt: 0,
      headers: { "retry-after": "soon" },
      expected: 500,
    },
    {
      name: "falls back to the backoff for a Retry-After already in the past",
      attempt: 1,
      headers: { "retry-after": "Wed, 21 Oct 2015 07:28:00 GMT" },
      expected: 1000,
    },
  ];

  for (const test of tests) {
    it(test.name, () => {
      const res = test.headers ? response(429, test.headers) : undefined;
      expect(retryDelayFor(res, test.attempt, base)).toBe(test.expected);
    });
  }

  it("honours Retry-After given as an HTTP date", () => {
    const at = new Date(Date.now() + 10_000).toUTCString();

    const delay = retryDelayFor(response(429, { "retry-after": at }), 0, base);

    // Whole seconds only in an HTTP date, so allow for the truncation.
    expect(delay).toBeGreaterThan(8000);
    expect(delay).toBeLessThanOrEqual(10_000);
  });
});

describe("sendFetch retrying", () => {
  const url = "https://example.com/repo/-/archive/main.tar.gz";
  // No waiting in tests; the delay itself is covered above.
  const noWait = { retry: 2, retryDelay: 0 };

  it("retries a 429 and returns the response that succeeds", async () => {
    // The case this exists for: a rate-limited host answers on a later attempt, and a
    // whole install should not fail because the first one was refused.
    const { calls } = stubFetch(response(429), response(429), response(200));

    const res = await sendFetch(url, noWait);

    expect(res.status).toBe(200);
    expect(calls).toHaveLength(3);
  });

  it.each([408, 409, 425, 429, 500, 502, 503, 504])("retries a %i", async (status) => {
    const { calls } = stubFetch(response(status), response(200));

    await sendFetch(url, noWait);

    expect(calls).toHaveLength(2);
  });

  it.each([400, 401, 403, 404, 410, 422])("does not retry a %i", async (status) => {
    // These say the request itself is wrong, so replaying it only wastes time.
    const { calls } = stubFetch(response(status));

    const res = await sendFetch(url, noWait);

    expect(res.status).toBe(status);
    expect(calls).toHaveLength(1);
  });

  it("retries a network error", async () => {
    const { calls } = stubFetch(new Error("ECONNRESET"), response(200));

    const res = await sendFetch(url, noWait);

    expect(res.status).toBe(200);
    expect(calls).toHaveLength(2);
  });

  it("gives up after the configured number of attempts", async () => {
    const { calls } = stubFetch(response(429));

    const res = await sendFetch(url, noWait);

    // Returned rather than thrown, as before: the caller decides what a 429 means.
    expect(res.status).toBe(429);
    expect(calls).toHaveLength(3);
  });

  it("surfaces the last error when every attempt fails to connect", async () => {
    const { calls } = stubFetch(new Error("ECONNREFUSED"));

    await expect(sendFetch(url, noWait)).rejects.toThrow(/Failed to download/);
    expect(calls).toHaveLength(3);
  });

  it("still validates the status when asked to", async () => {
    stubFetch(response(503));

    await expect(sendFetch(url, { ...noWait, validateStatus: true })).rejects.toThrow(
      /Failed to fetch .*503/,
    );
  });

  it("makes one attempt when retrying is switched off", async () => {
    const { calls } = stubFetch(response(429));

    await sendFetch(url, { retry: 0 });

    expect(calls).toHaveLength(1);
  });

  it("does not replay a request that is not safe to replay", async () => {
    // giget only issues GET and HEAD; this keeps that from being outgrown silently.
    const { calls } = stubFetch(response(429));

    await sendFetch(url, { ...noWait, method: "POST" });

    expect(calls).toHaveLength(1);
  });

  it("retries a HEAD, which is how the cache is revalidated", async () => {
    const { calls } = stubFetch(response(503), response(200));

    await sendFetch(url, { ...noWait, method: "HEAD" });

    expect(calls).toHaveLength(2);
  });

  it("takes its defaults from the environment", async () => {
    vi.stubEnv("GIGET_RETRY", "1");
    vi.stubEnv("GIGET_RETRY_DELAY", "0");
    const { calls } = stubFetch(response(429));

    await sendFetch(url);

    expect(calls).toHaveLength(2);
    vi.unstubAllEnvs();
  });
});
