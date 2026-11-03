import Link from "next/link";

const NAV_LINKS = [
  { href: "/characters", label: "Characters" },
  { href: "/weapons", label: "Weapons" },
  { href: "/echoes", label: "Echoes" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="size-2 rounded-full bg-accent" />
          Wuwa Wiki
        </Link>
        <nav className="flex gap-6 text-sm text-muted">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
