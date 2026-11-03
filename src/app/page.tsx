import Link from "next/link";

const SECTIONS = [
  { href: "/characters", label: "Characters", description: "Skills, resonance chains, and leveling costs" },
  { href: "/weapons", label: "Weapons", description: "Base stats and refinement scaling for every weapon" },
  { href: "/echoes", label: "Echoes", description: "Cost tiers and Sonata set bonuses" },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Wuwa Wiki</h1>
      <p className="mt-2 text-muted">A Wuthering Waves character, weapon, and echo database.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-xl border border-border bg-surface p-5 transition hover:border-accent"
          >
            <div className="font-medium">{section.label}</div>
            <div className="mt-1 text-sm text-muted">{section.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
