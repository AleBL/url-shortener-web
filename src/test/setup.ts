import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// No test talks to a real server: tests that need fetch stub it themselves.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("Network is disabled in tests"))),
  );
});

// Vitest runs without globals, so Testing Library cannot register its
// automatic cleanup. Reset the DOM, storage and mocks after each test here.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("lang");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
