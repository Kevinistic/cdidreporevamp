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

	const rimsCode = card.Rims?.match(/\d+$/);

	const clamp = (n: unknown) => {
		const v = Number(n);
 		if (Number.isNaN(v)) return 0;
 		return Math.max(0, Math.min(255, v));
 	};
	const toHex = (n: number) => n.toString(16).padStart(2, "0");
	const hexCode = `#${toHex(clamp(card.rgb_0))}${toHex(clamp(card.rgb_1))}${toHex(clamp(card.rgb_2))}`;
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
				className="relative flex h-[80vh] w-[90vw] max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-950 text-white shadow-2xl md:h-3/5 md:w-1/2"
				onClick={(event) => event.stopPropagation()}
			>
				<button
					type="button"
					onClick={onBack}
					className="absolute left-4 top-4 rounded-md border border-gray-600 bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800"
				>
					Back
				</button>

				<div className="flex h-full flex-col gap-6 overflow-y-auto p-6 pt-16 md:flex-row md:items-center md:justify-between [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-600">
					<div className="flex-1 space-y-4">
						<p className="text-xs uppercase tracking-[0.2em] text-gray-400">Car Details</p>
						<div className="flex items-center gap-2">
							<h2 className="text-3xl font-bold">{card.CarName}</h2>
							{infoText ? (
								<div
									className="relative flex items-center"
									onMouseEnter={(event) => setTooltipPosition({ x: event.clientX, y: event.clientY })}
									onMouseMove={(event) => setTooltipPosition({ x: event.clientX, y: event.clientY })}
									onMouseLeave={() => setTooltipPosition(null)}
								>
									<Info size={18} className="text-gray-400" />
									{tooltipPosition ? (
										<div
											className="pointer-events-none fixed z-[60] whitespace-pre-line rounded-md border border-gray-600 bg-gray-900 px-2 py-1 text-xs text-white shadow-lg"
											style={{ left: tooltipPosition.x + 12, top: tooltipPosition.y + 12 }}
										>
											{infoText}
										</div>
									) : null}
								</div>
							) : null}
						</div>
						<p className="text-xl text-gray-200">Rp. {card.Price.toLocaleString("de-DE")}</p>

						<div className="space-y-2 text-sm text-gray-300">
							<p><span className="text-gray-500">Dealership:</span> {card.Dealership || "N/A"}</p>
							<p><span className="text-gray-500">Limited:</span> {card.Limited ?? "No"}</p>
							<p><span className="text-gray-500">Gamepass:</span> {card.Gamepass ?? "No"}</p>
							<p><span className="text-gray-500">Engine:</span> {card.Engine || "N/A"}</p>
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

									<div className="h-1/2 w-full flex">
										<div className="flex-1 flex items-center justify-center p-2">
											{card.RimsUrl ? (
												<div className="flex w-full flex-col items-center">
													<div className="relative aspect-square w-full max-w-[160px]">
														<Image
															src={card.RimsUrl}
															alt={`${card.CarName} rims`}
															fill
															sizes="(max-width: 768px) 45vw, 200px"
															className="object-contain"
														/>
													</div>
													<span className="sr-only">Rims image</span>
													<p className="mt-1 text-xs text-gray-400 break-all">{`Code: ${rimsCode ? rimsCode[0] : 'N/A'}`}</p>
												</div>

											) : (
												<div className="h-full w-full flex items-center justify-center text-sm text-gray-400">No rims</div>
											)}
										</div>

										<div className="flex-1 p-2">
											<div className="w-full max-w-[160px] aspect-square rounded-md border border-gray-600 overflow-hidden mx-auto"
												style={{
													backgroundColor: `rgb(${card.rgb_0 ?? 0}, ${card.rgb_1 ?? 0}, ${card.rgb_2 ?? 0})`,
												}}
											>
											</div>
											<p className="mt-2 text-xs text-gray-400 break-all">{`Code: ${hexCode}`}</p>
										</div>
									</div>
								</div>
							</div>
						) : null}
				</div>
			</section>
		</div>
	);
}
