import { useCallback, useEffect, useRef, useState } from "react";

export const COPIED_RESET_MS = 2000;

/**
 * Copies text and flags `copied` for two seconds. `copy` resolves to false
 * when the Clipboard API is missing or refuses, so the caller can fall back.
 */
export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return false;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    return true;
  }, []);

  return { copied, copy };
}
