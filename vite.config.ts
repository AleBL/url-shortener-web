import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// Fails the build early: a deploy without the API URL would ship a page
// that cannot shorten anything.
function assertApiUrl(mode: string) {
  const { VITE_API_URL } = loadEnv(mode, process.cwd());
  let url: URL;
  try {
    url = new URL(VITE_API_URL ?? "");
  } catch {
    throw new Error(
      "VITE_API_URL is missing or invalid. Set it in .env.local or in the build environment (see .env.example).",
    );
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`VITE_API_URL must use http or https, got "${VITE_API_URL}".`);
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    assertApiUrl(mode);
  }

  return {
    plugins: [react(), tailwindcss()],
  };
});
