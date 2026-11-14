"use client";

import { X } from "lucide-react";
import { useSyncExternalStore } from "react";
import { SITE_URL } from "../lib/site";

// Once closed, the notice stays closed in that browser. Change the key to show a new notice to everyone again,
// including people who closed this one.
const STORAGE_KEY = "notice-dismissed:new-domain";
const DOMAIN = new URL(SITE_URL).host;

const listeners = new Set<() => void>();
// Where storage is blocked (some private windows, site data turned off) the notice still closes for this visit;
// it just comes back on the next full page load.
let dismissedThisVisit = false;

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Closing it in one tab closes it in the others.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function isDismissed() {
  if (dismissedThisVisit) return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

function dismiss() {
  dismissedThisVisit = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {}
  listeners.forEach((listener) => listener());
}

export function DomainNotice() {
  // The prerendered HTML can't know what this browser stored, so it has no notice (the server snapshot says
  // closed) and the notice appears after hydration. Rendering it by default would flash it for everyone who closed it.
  const dismissed = useSyncExternalStore(subscribe, isDismissed, () => true);
  if (dismissed) return null;

  return (
    // Above the filter sheet's backdrop (z-30), below the filter sheet (z-40) and modals (z-50). Sits above the
    // footer, which is always on screen on /car.
    <aside
      aria-label="Site notice"
      className="fixed bottom-[calc(var(--footer-h)+1rem)] left-4 right-4 z-35 flex items-start gap-3 rounded-lg border border-accent bg-zinc-950 p-4 text-white shadow-2xl sm:left-auto sm:w-80"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-bold text-accent">New web domain!</p>
        <p className="text-sm text-zinc-400">
          CDID Repo now lives at <span className="font-bold text-white">{DOMAIN}</span>. Update your bookmarks.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Close notice"
        className="shrink-0 rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}
