"use client";

import { SquareArrowOutUpRight, ScrollText, CodeXml, Lightbulb } from "lucide-react";
import { Modal } from "./modal";

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
    <div className="flex w-full items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm text-zinc-300">{title}</p>
        <p className="text-sm text-zinc-500">{desc}</p>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-left text-xs text-zinc-500 font-medium whitespace-nowrap transition hover:text-zinc-300"
      >
        <span>{label}</span>
        <SquareArrowOutUpRight size={16} aria-hidden="true" />
      </a>
    </div>
  );
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
      {icon}
      {children}
    </h2>
  );
}

export function Credits({ onBack }: CreditsProps) {
  return (
    <Modal label="Credits" onClose={onBack} className="max-w-xl" contentClassName="gap-4">
      <SectionHeading icon={<ScrollText size={16} className="inline-block" aria-hidden="true" />}>Credits</SectionHeading>

      <div className="flex max-w-full flex-col gap-2">
        <CreditsButton title="CDID Roblox" desc="Car Driving Indonesia Roblox Game" label="roblox.com" href="https://www.roblox.com/games/6911148748/Car-Driving-Indonesia" />
        <CreditsButton title="CDID Wiki" desc="Car Driving Indonesia Wiki" label="cardrivingindonesia.fandom.com" href="https://cardrivingindonesia.fandom.com/wiki/CDID_Wiki" />
        <CreditsButton title="CDID Discord" desc="Car Driving Indonesia Discord Server" label="discord.gg" href="https://discord.gg/cdid" />
      </div>

      <SectionHeading icon={<CodeXml size={16} className="inline-block" aria-hidden="true" />}>Built with</SectionHeading>

      <div className="flex max-w-full flex-col gap-2">
        <CreditsButton title="Next.js" desc="The React Framework for Production" label="nextjs.org" href="https://nextjs.org/" />
        <CreditsButton title="React" desc="A JavaScript library for building user interfaces" label="react.dev" href="https://react.dev/" />
        <CreditsButton title="TypeScript" desc="JavaScript with syntax for types" label="typescriptlang.org" href="https://www.typescriptlang.org/" />
        <CreditsButton title="Tailwind CSS" desc="A utility-first CSS framework" label="tailwindcss.com" href="https://tailwindcss.com/" />
        <CreditsButton title="Lucide Icons" desc="A collection of free, open-source icons" label="lucide.dev" href="https://lucide.dev/" />
      </div>

      <SectionHeading icon={<Lightbulb size={16} className="inline-block" aria-hidden="true" />}>Developer</SectionHeading>

      <div className="flex max-w-full flex-col gap-2">
        <CreditsButton title="aoderu" desc="Design & Development" label="guns.lol" href="https://guns.lol/aoderu" />
      </div>
    </Modal>
  );
}
