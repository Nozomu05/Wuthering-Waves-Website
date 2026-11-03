"use client";

import { useState } from "react";

export function SectionTabs({
  tabs,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div className="sticky top-[57px] z-10 -mx-6 border-b border-border bg-background/85 px-6 backdrop-blur-md">
        <nav className="mx-auto flex max-w-4xl gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`border-b-2 py-3 text-sm font-medium transition ${
                active === tab.id
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mx-auto max-w-4xl px-6 py-8">
        {tabs.find((tab) => tab.id === active)?.content}
      </div>
    </div>
  );
}
