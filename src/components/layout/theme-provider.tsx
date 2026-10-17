"use client";

import { useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "nh.theme";
const THEME_EVENT = "nh:themechange";

/** Runs before paint so the first frame already has the right theme. */
export const themeBootstrapScript = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var dark = stored ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`;

/**
 * `document.documentElement.dataset.theme` is the single source of truth — the
 * bootstrap script above sets it before React hydrates. Reading it through an
 * external store avoids a post-mount state sync and the flash that comes with it.
 */
function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

const getSnapshot = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

const getServerSnapshot = (): Theme => "light";

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage can be blocked; the DOM attribute still applies */
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  return { theme, toggle };
}

/** Kept so the root layout has one obvious place to wrap theme concerns. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return children;
}
