"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Polls a JSON endpoint on an interval. Pauses while the tab is hidden so a
 * backgrounded tab isn't hammering the API, and refetches immediately on focus.
 */
export function usePolling<T>(
  url: string | null,
  intervalMs: number,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const savedUrl = useRef(url);
  savedUrl.current = url;

  useEffect(() => {
    if (!url || !enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!cancelled && res.ok) {
            setData(await res.json());
            setError(null);
          }
        } catch {
          if (!cancelled) setError("Could not refresh");
        }
      }
      if (!cancelled) timer = setTimeout(tick, intervalMs);
    };

    timer = setTimeout(tick, intervalMs);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [url, intervalMs, enabled]);

  return { data, error };
}
