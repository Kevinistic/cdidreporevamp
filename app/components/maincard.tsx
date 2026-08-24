"use client";

import Image from "next/image";
import { Info } from "lucide-react";
import { useMemo, useState } from "react";
import type { CardItem } from "./card";

type MainCardProps = {
	card: CardItem;
	onBack: () => void;
};

export function MainCard({ card, onBack }: MainCardProps) {
	const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

	const clamp = (n: unknown) => {
		const v = Number(n);
 		if (Number.isNaN(v)) return 0;
 		return Math.max(0, Math.min(255, v));
 	};
	const isTrue = (value: unknown) => String(value).toLowerCase() === "true";
	const infoText = useMemo(() => {
		const messages: string[] = [];

		if (isTrue(card.Legacy)) {
			messages.push("No longer in-game");
		}

		if (isTrue(card.Inaccurate)) {
			messages.push("May be inaccurate");
		}

		return messages.join("\n");
	}, [card.Inaccurate, card.Legacy]);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
			onClick={onBack}
		>
			<section
				className="relative flex h-[80vh] w-[90vw] max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 text-white shadow-2xl md:h-3/5 md:w-1/2"
				onClick={(event) => event.stopPropagation()}
			>
				<button
					type="button"
					onClick={onBack}
					className="absolute left-4 top-4 rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800"
				>
					Back
				</button>

				<div className="flex h-full flex-col gap-6 overflow-y-auto p-6 pt-16 md:flex-row md:items-center md:justify-between [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-zinc-600">
					<div className="flex-1 space-y-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Car Details</p>
						<div className="flex items-center gap-2">
							<h2 className="text-3xl font-bold">{card.CarName}</h2>
							{infoText ? (
								<div
									className="relative flex items-center"
									onMouseEnter={(event) => setTooltipPosition({ x: event.clientX, y: event.clientY })}
									onMouseMove={(event) => setTooltipPosition({ x: event.clientX, y: event.clientY })}
									onMouseLeave={() => setTooltipPosition(null)}
								>
									<Info size={18} className="text-zinc-400" />
									{tooltipPosition ? (
										<div
											className="pointer-events-none fixed z-[60] whitespace-pre-line rounded-md border border-zinc-600 bg-zinc-900 px-2 py-1 text-xs text-white shadow-lg"
											style={{ left: tooltipPosition.x + 12, top: tooltipPosition.y + 12 }}
										>
											{infoText}
										</div>
									) : null}
								</div>
							) : null}
						</div>
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
				</div>
			</section>
		</div>
	);
}
