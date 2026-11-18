import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  DEFAULT_RETRY_AFTER_SECONDS,
  parseRetryAfter,
  shortenUrl,
  warmUp,
  type ShortenResult,
} from "./api";

vi.mock("../config", () => ({ API_URL: "https://api.example.test" }));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function failed(error: unknown): ShortenResult {
  return { ok: false, error } as ShortenResult;
}

describe("shortenUrl", () => {
  test("posts the URL as JSON with a timeout signal", async () => {
    fetchMock.mockResolvedValue(
      json({ short_url: "https://api.example.test/aZ3kP9" }),
    );

    await shortenUrl("https://go.dev");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [input, init] = fetchMock.mock.calls[0];
    expect(input).toBe("https://api.example.test/shorten");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(init?.body).toBe(JSON.stringify({ url: "https://go.dev" }));
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  test("200 returns the short URL", async () => {
    fetchMock.mockResolvedValue(
      json({ short_url: "https://api.example.test/aZ3kP9" }),
    );

    await expect(shortenUrl("https://go.dev")).resolves.toEqual({
      ok: true,
      shortUrl: "https://api.example.test/aZ3kP9",
    });
  });

  test("400 is invalid", async () => {
    fetchMock.mockResolvedValue(json({ error: "bad" }, { status: 400 }));

    await expect(shortenUrl("https://go.dev")).resolves.toEqual(
      failed({ kind: "invalid" }),
    );
  });

  test("429 reads Retry-After", async () => {
    fetchMock.mockResolvedValue(
      json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "6" } },
      ),
    );

    await expect(shortenUrl("https://go.dev")).resolves.toEqual(
      failed({ kind: "rate_limited", retryAfter: 6 }),
    );
  });

  test("429 without Retry-After waits the default", async () => {
    fetchMock.mockResolvedValue(json({}, { status: 429 }));

    await expect(shortenUrl("https://go.dev")).resolves.toEqual(
      failed({ kind: "rate_limited", retryAfter: DEFAULT_RETRY_AFTER_SECONDS }),
    );
  });

  test.each([500, 503, 404])("%i is a server error", async (status) => {
    fetchMock.mockResolvedValue(json({ error: "oops" }, { status }));

    await expect(shortenUrl("https://go.dev")).resolves.toEqual(
      failed({ kind: "server" }),
    );
  });

  test("a rejected fetch is a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(shortenUrl("https://go.dev")).resolves.toEqual(
      failed({ kind: "network" }),
    );
  });

  test("a fetch that throws synchronously is a network error", async () => {
    fetchMock.mockImplementation(() => {
      throw new TypeError("Invalid URL");
    });

    await expect(shortenUrl("https://go.dev")).resolves.toEqual(
      failed({ kind: "network" }),
    );
  });

  test("a TimeoutError is a timeout", async () => {
    fetchMock.mockRejectedValue(
      new DOMException("The operation timed out.", "TimeoutError"),
    );

    await expect(shortenUrl("https://go.dev")).resolves.toEqual(
      failed({ kind: "timeout" }),
    );
  });

  test("a timeout while reading the body is a timeout", async () => {
    const response = json({});
    vi.spyOn(response, "json").mockRejectedValue(
      new DOMException("The operation timed out.", "TimeoutError"),
    );
    fetchMock.mockResolvedValue(response);

    await expect(shortenUrl("https://go.dev")).resolves.toEqual(
      failed({ kind: "timeout" }),
    );
  });

  test.each([
    { name: "missing short_url", response: () => json({}) },
    { name: "non-string short_url", response: () => json({ short_url: 42 }) },
    { name: "empty short_url", response: () => json({ short_url: "" }) },
    {
      name: "non-http short_url",
      response: () => json({ short_url: "javascript:alert(1)" }),
    },
    { name: "array body", response: () => json(["x"]) },
    { name: "non-JSON body", response: () => new Response("<html>") },
  ])("200 with $name is a server error", async ({ response }) => {
    fetchMock.mockResolvedValue(response());

    await expect(shortenUrl("https://go.dev")).resolves.toEqual(
      failed({ kind: "server" }),
    );
  });
});

describe("parseRetryAfter", () => {
  test.each([
    { header: "6", expected: 6 },
    { header: " 30 ", expected: 30 },
    { header: "0", expected: 1 },
    { header: null, expected: DEFAULT_RETRY_AFTER_SECONDS },
    { header: "", expected: DEFAULT_RETRY_AFTER_SECONDS },
    { header: "soon", expected: DEFAULT_RETRY_AFTER_SECONDS },
    { header: "-5", expected: DEFAULT_RETRY_AFTER_SECONDS },
    { header: "1.5", expected: DEFAULT_RETRY_AFTER_SECONDS },
    {
      header: "Wed, 21 Oct 2026 07:28:00 GMT",
      expected: DEFAULT_RETRY_AFTER_SECONDS,
    },
  ])("$header -> $expected", ({ header, expected }) => {
    expect(parseRetryAfter(header)).toBe(expected);
  });
});

describe("warmUp", () => {
  test("pings /health", () => {
    fetchMock.mockResolvedValue(json({ status: "ok" }));

    warmUp();

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.test/health", {
      method: "GET",
    });
  });

  test("swallows failures", async () => {
    // A plain function, not vi.fn: the spy would attach its own handlers to
    // the returned promise and hide an unhandled rejection.
    vi.stubGlobal("fetch", () =>
      Promise.reject(new TypeError("Failed to fetch")),
    );

    expect(() => warmUp()).not.toThrow();
    // Vitest fails the run on an unhandled rejection once this settles.
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
});
