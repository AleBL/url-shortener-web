import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Vitest runs without globals, so Testing Library cannot register its
// automatic cleanup. Reset the DOM, storage and mocks after each test here.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("lang");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
