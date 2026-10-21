"use client";

import { Check, SquareArrowOutUpRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CardItem } from "./card";
import { Modal } from "./modal";

export const CAR_MODAL_CONTENT_CLASS = "gap-6 md:flex-row md:items-center md:justify-between";

function ShareButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/car/${token}`);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copyLink}
      aria-label={copied ? "Link copied" : "Copy link to this car"}
      title={copied ? "Link copied" : "Copy link"}
      className="rounded-md border border-zinc-600 bg-zinc-900 p-2 text-white hover:bg-zinc-800"
    >
      {copied ? <Check size={16} /> : <SquareArrowOutUpRight size={16} />}
    </button>
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

  return (
    <Modal
      label={card.CarName}
      onClose={() => (closeTo ? router.replace(closeTo) : router.back())}
      className="max-w-4xl"
      contentClassName={CAR_MODAL_CONTENT_CLASS}
      actions={<ShareButton token={card.token} />}
    >
      <CarDetails card={card} />
    </Modal>
  );
}
