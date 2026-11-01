import Image from "next/image";
import Link from "next/link";
import type { CardItem } from "./card";
import { cn } from "../lib/cn";

export function CarTile({ card }: { card: CardItem }) {
  return (
    <Link
      href={`/car/${card.token}`}
      className={cn(
        "flex h-full flex-col justify-between rounded-lg border border-zinc-700 hover:border-zinc-500 p-2 text-white shadow-sm",
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
    </Link>
  );
}
