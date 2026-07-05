"use client";

import { SquareArrowOutUpRight, ScrollText, CodeXml, Lightbulb } from "lucide-react";

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
				className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-left text-xs text-gray-500 font-medium whitespace-nowrap transition hover:text-gray-300"
			>
				<span>{label}</span>
				<SquareArrowOutUpRight size={16} />
			</button>
		</div>
    );
}

export function Credits({ onBack }: CreditsProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={onBack}>
			<section className="relative flex h-[80vh] w-[90vw] max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-950 text-white shadow-2xl md:h-3/5 md:w-1/2" onClick={(event) => event.stopPropagation()}>
				<button type="button" onClick={onBack} className="absolute left-4 top-4 rounded-md border border-gray-600 bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800">
					Back
				</button>

				<div className="flex h-full flex-col gap-4 overflow-y-auto p-6 pt-16 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-600">
					<p className="text-xs uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                        <ScrollText size={16} className="inline-block"/>
                        Credits
                    </p>

					<div className="flex max-w-full flex-col gap-2">
						<CreditsButton title="CDID Roblox" desc="Car Driving Indonesia Roblox Game" label="roblox.com" href="https://www.roblox.com/games/6911148748/Car-Driving-Indonesia" />
						<CreditsButton title="CDID Wiki" desc="Car Driving Indonesia Wiki" label="cardrivingindonesia.fandom.com" href="https://cardrivingindonesia.fandom.com/wiki/CDID_Wiki" />
						<CreditsButton title="CDID Discord" desc="Car Driving Indonesia Discord Server" label="discord.gg" href="https://discord.gg/cdid" />
					</div>

					<p className="text-xs uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                        <CodeXml size={16} className="inline-block"/>
                        Built with
                    </p>

					<div className="flex max-w-full flex-col gap-2">
						<CreditsButton title="Next.js" desc="The React Framework for Production" label="nextjs.org" href="https://nextjs.org/" />
						<CreditsButton title="React" desc="A JavaScript library for building user interfaces" label="react.dev" href="https://react.dev/" />
						<CreditsButton title="TypeScript" desc="JavaScript with syntax for types" label="typescriptlang.org" href="https://www.typescriptlang.org/" />
						<CreditsButton title="Tailwind CSS" desc="A utility-first CSS framework" label="tailwindcss.com" href="https://tailwindcss.com/" />
						<CreditsButton title="Lucide Icons" desc="A collection of free, open-source icons" label="lucide.dev" href="https://lucide.dev/" />
					</div>

                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                        <Lightbulb size={16} className="inline-block"/>
                        Developer
                    </p>

					<div className="flex max-w-full flex-col gap-2">
                        <CreditsButton title="aoderu" desc="Design & Development" label="guns.lol" href="https://guns.lol/aoderu" />
                    </div>
                </div>
            </section>
        </div>
    );
}
