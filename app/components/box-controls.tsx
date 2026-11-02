"use client";

import Image from "next/image";
import { formatBoxPrice, ITEM_ICONS } from "../lib/box-display";
import type { SimBox, SimItem } from "../lib/box-sim";
import { cn } from "../lib/cn";

export function ItemImage({ item, size, iconSize }: { item: SimItem; size: number; iconSize: number }) {
  const Icon = ITEM_ICONS[item.itemType];
  return item.image ? (
    <Image src={item.image} alt="" fill sizes={`${size}px`} loading="eager" className="object-contain" />
  ) : (
    <Icon size={iconSize} aria-hidden="true" className="text-zinc-500" />
  );
}

type BoxPickerProps = {
  boxes: SimBox[];
  activeBox: SimBox;
  onSelect: (slug: string) => void;
  disabled?: boolean;
};

export function BoxPicker({ boxes, activeBox, onSelect, disabled }: BoxPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {boxes.map(({ slug, name }) => {
        const active = slug === activeBox.slug;
        return (
          <button
            key={slug}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(slug)}
            disabled={disabled}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm disabled:opacity-40",
              active ? "border-accent text-accent" : "border-zinc-700 text-zinc-400 hover:text-white"
            )}
          >
            {name}
          </button>
        );
      })}
      <p className="ml-auto text-zinc-200">{formatBoxPrice(activeBox)}</p>
    </div>
  );
}
