"use client";

import { useEffect, useRef } from "react";
import { cn } from "../lib/cn";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ModalProps = {
  label: string;
  onClose: () => void;
  className?: string;
  contentClassName?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function Modal({ label, onClose, className, contentClassName, actions, children }: ModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  // A drag that starts inside the dialog and ends on the backdrop still clicks the backdrop,
  // so only close when the press also started there.
  const pressedBackdropRef = useRef(false);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      const dialog = dialogRef.current;
      if (event.key !== "Tab" || !dialog) return;

      // Keep Tab focus inside the dialog
      const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
      onPointerDown={(event) => {
        pressedBackdropRef.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (pressedBackdropRef.current && event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          "relative flex h-[80dvh] w-[90vw] flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 text-white shadow-2xl focus:outline-none md:h-3/5 md:w-1/2",
          className
        )}
      >
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800"
          >
            Back
          </button>
          {actions}
        </div>

        <div
          className={cn(
            "flex h-full flex-col overflow-y-auto p-6 pt-16 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-zinc-600",
            contentClassName
          )}
        >
          {children}
        </div>
      </section>
    </div>
  );
}
