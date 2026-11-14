import Image from "next/image";
import type { CardItem } from "./card";
import { cn } from "../lib/cn";

type CarTileProps = {
  card: CardItem;
  // Given on the car grid, which already holds every car: a plain click opens the modal from memory instead
  // of navigating, so it costs no request. Elsewhere a CarModalArea around the tiles does the same.
  onOpen?: (card: CardItem) => void;
};

export function CarTile({ card, onOpen }: CarTileProps) {
  return (
    // A plain <a>, not next/link: car pages are opened by a full page load only (see app/car/[token]).
    <a
      href={`/car/${card.token}`}
      onClick={
        onOpen
          ? (event) => {
              // Modified and middle clicks keep the link, so "open in new tab" still loads the full car page.
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              onOpen(card);
            }
          : undefined
      }
      className={cn(
        "flex h-full flex-col justify-between rounded-lg border border-zinc-700 hover:border-accent p-2 text-white shadow-sm",
        card.Legacy ? "bg-[#230405]" : "bg-zinc-950"
      )}
    >
      <div>
        <p className="text-sm font-bold text-center">{card.CarName}</p>
        <p className="text-xs text-center">Rp. {card.Price.toLocaleString("de-DE")}</p>
      </div>
      {card.CarImageUrl && (
        <div className="relative mb-1 h-24 w-full">
          <Image
            src={card.CarImageUrl}
            alt={card.CarName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain"
          />
        </div>
      )}
    </a>
  );
}
