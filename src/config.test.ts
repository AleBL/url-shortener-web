import { beforeEach, expect, test, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

test("API_URL drops trailing slashes", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test//");

  const { API_URL } = await import("./config");

  expect(API_URL).toBe("https://api.example.test");
});

test("API_URL is empty when the variable is missing", async () => {
  vi.stubEnv("VITE_API_URL", undefined);

  const { API_URL } = await import("./config");

  expect(API_URL).toBe("");
});
