import { useCallback, useEffect, useState } from "react";
import {
  addToHistory,
  loadHistory,
  saveHistory,
  type HistoryItem,
} from "../lib/history";

/** Recent links in this browser, kept in sync with localStorage. */
export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>(loadHistory);

  useEffect(() => {
    saveHistory(items);
  }, [items]);

  const add = useCallback((item: HistoryItem) => {
    setItems((current) => addToHistory(current, item));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, add, clear };
}
