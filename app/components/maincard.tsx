"use client";

import { Check, Link as LinkIcon, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CardItem } from "./card";
import { cn } from "../lib/cn";
import { Modal } from "./modal";

export const CAR_MODAL_CONTENT_CLASS = "gap-6 md:flex-row md:items-center md:justify-between";

type ShareStatus = "idle" | "copied" | "failed";

const SHARE_STATUS_TEXT: Record<ShareStatus, string> = {
  idle: "Copy link",
  copied: "Link copied",
  failed: "Couldn't copy link",
};

function ShareButton({ token, title }: { token: string; title: string }) {
  const [status, setStatus] = useState<ShareStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const showStatus = (next: ShareStatus) => {
    setStatus(next);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/car/${token}`;

    // Touch devices get the native share sheet. Desktop browsers have navigator.share too,
    // but people there expect a plain copy.
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Closing the sheet rejects with AbortError, which isn't a failure.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showStatus("copied");
    } catch {
      showStatus("failed");
    }
  };

  const StatusIcon = status === "copied" ? Check : status === "failed" ? X : LinkIcon;

  return (
    <>
      <button
        type="button"
        onClick={shareLink}
        aria-label={status === "idle" ? "Share link to this car" : SHARE_STATUS_TEXT[status]}
        title={SHARE_STATUS_TEXT[status]}
        className={cn(
          "rounded-md border bg-zinc-900 p-2 hover:bg-zinc-800",
          status === "copied" && "border-emerald-600 text-emerald-400",
          status === "failed" && "border-rose-600 text-rose-400",
          status === "idle" && "border-zinc-600 text-white"
        )}
      >
        <StatusIcon size={16} aria-hidden="true" />
      </button>
      <span role="status" className="sr-only">
        {status === "idle" ? "" : SHARE_STATUS_TEXT[status]}
      </span>
    </>
  );
}

export function CarDetails({ card }: { card: CardItem }) {
  return (
    <>
      <div className="flex-1 space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Car Details</p>
        <h2 className="text-3xl font-bold">{card.CarName}</h2>

        {card.Legacy || card.Inaccurate ? (
          <div className="flex flex-wrap gap-2">
            {card.Legacy ? (
              <span className="rounded-full border border-rose-600 bg-rose-950/20 px-3 py-1 text-xs font-medium text-rose-400">
                No longer in-game
              </span>
            ) : null}
            {card.Inaccurate ? (
              <span className="rounded-full border border-amber-600 bg-amber-950/20 px-3 py-1 text-xs font-medium text-amber-400">
                May be inaccurate
              </span>
            ) : null}
          </div>
        ) : null}

        <p className="text-xl text-zinc-200">Rp. {card.Price.toLocaleString("de-DE")}</p>

        <div className="space-y-2 text-sm text-zinc-300">
          <p><span className="text-zinc-500">Dealership:</span> {card.Dealership || "N/A"}</p>
          <p><span className="text-zinc-500">Limited:</span> {card.Limited ?? "No"}</p>
          <p><span className="text-zinc-500">Gamepass:</span> {card.Gamepass ?? "No"}</p>
          <p><span className="text-zinc-500">Engine:</span> {card.Engine || "N/A"}</p>
        </div>
      </div>

      {card.CarImageUrl ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex h-full w-full max-w-[420px] flex-col">
            <div className="relative aspect-square w-full">
              <Image
                src={card.CarImageUrl}
                alt={card.CarName}
                fill
                sizes="(max-width: 768px) 90vw, 420px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

// Intercepted /car/[token] closes with a history step back to the grid. On a direct load there is
// no grid entry behind it, so the page passes `closeTo` to go home instead.
export function CarModal({ card, closeTo }: { card: CardItem; closeTo?: string }) {
  const router = useRouter();
  // The modal stays up until the navigation lands, so a double click or held Escape would
  // otherwise step back twice and leave the grid.
  const closingRef = useRef(false);

  useEffect(() => {
    closingRef.current = false;
  }, []);

  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (closeTo) router.replace(closeTo);
    else router.back();
  };

  return (
    <Modal
      label={card.CarName}
      onClose={close}
      className="max-w-4xl"
      contentClassName={CAR_MODAL_CONTENT_CLASS}
      actions={<ShareButton token={card.token} title={card.CarName} />}
    >
      <CarDetails card={card} />
    </Modal>
  );
}
