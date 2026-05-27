"use client";

import { SquareArrowOutUpRight, ScrollText, Code, CodeXml, Lightbulb } from "lucide-react";

type CreditsProps = {
	onBack: () => void;
};

type CreditsButtonProps = {
	title: string;
	desc: string;
	label: string;
	href: string;
};

function CreditsButton({ title, desc, label, href }: CreditsButtonProps) {
	return (
		<div className="flex w-full items-center justify-between gap-4 rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2">
			<div className="min-w-0">
				<p className="text-sm text-gray-300">{title}</p>
				<p className="text-sm text-gray-500">{desc}</p>
			</div>

			<button
				type="button"
				onClick={() => window.open(href, "_blank")}
				className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-700 bg-gray-900 px-3 py-1 text-left text-xs font-medium whitespace-nowrap transition hover:bg-gray-800"
			>
				<span>{label}</span>
				<SquareArrowOutUpRight size={16} color="#6B7280" />
			</button>
		</div>
    );
}

export function Credits({ onBack }: CreditsProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={onBack}>
			<section className="relative flex h-3/5 w-1/2 flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-950 text-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
				<button type="button" onClick={onBack} className="absolute left-4 top-4 rounded-md border border-gray-600 bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800">
					Back
				</button>

				<div className="flex h-full flex-col gap-4 overflow-y-auto p-6 pt-16 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-600">
					<p className="text-xs uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                        <ScrollText size={16} className="inline-block"/>
                        Credits
                    </p>

					<CreditsButton 
                        title="CDID" 
                        desc="Car Driving Indonesia Roblox Game"
                        label="CDID Roblox Page" 
                        href="https://www.roblox.com/games/6911148748/Car-Driving-Indonesia" />

					<p className="text-xs uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                        <CodeXml size={16} className="inline-block"/>
                        Built with
                    </p>

					<div className="flex max-w-full flex-col gap-2">
						<CreditsButton title="Next.js" desc="The React Framework for Production" label="Next.js" href="https://nextjs.org/" />
						<CreditsButton title="React" desc="A JavaScript library for building user interfaces" label="React" href="https://react.dev/" />
						<CreditsButton title="TypeScript" desc="JavaScript with syntax for types" label="TypeScript" href="https://www.typescriptlang.org/" />
						<CreditsButton title="Tailwind CSS" desc="A utility-first CSS framework" label="Tailwind CSS" href="https://tailwindcss.com/" />
						<CreditsButton title="Lucide Icons" desc="A collection of free, open-source icons" label="Lucide Icons" href="https://lucide.dev/" />
					</div>

                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                        <Lightbulb size={16} className="inline-block"/>
                        Developer
                    </p>

					<div className="flex max-w-full flex-col gap-2">
                        <CreditsButton title="aoderu" desc="Design & Development" label="aoderu" href="https://guns.lol/aoderu" />
                    </div>
                </div>
            </section>
        </div>
    );
}
