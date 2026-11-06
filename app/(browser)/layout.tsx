// The car browser scrolls inside its grid and sidebar, so it fills the space between the nav and
// footer instead of letting the page scroll.
export default function BrowserLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex h-[calc(100dvh-var(--nav-h)-var(--footer-h))] w-full overflow-hidden">{children}</div>;
}
