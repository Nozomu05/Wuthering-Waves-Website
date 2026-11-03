"use client";

import { useState } from "react";

interface SkillMove {
  label: string;
  valuesByLevel: string[];
}

export function SkillMultiplierTable({ moves }: { moves: SkillMove[] }) {
  const [level, setLevel] = useState(10);

  if (moves.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={1}
          max={10}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="h-1.5 w-32 accent-accent"
        />
        <span className="text-xs text-muted">Skill Lv. {level}</span>
      </div>
      <div className="mt-2 overflow-hidden rounded-lg border border-border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-hover text-muted">
              <th className="px-3 py-1.5 text-left font-medium">Attack</th>
              <th className="px-3 py-1.5 text-right font-medium">DMG</th>
            </tr>
          </thead>
          <tbody>
            {moves.map((move, i) => (
              <tr key={`${move.label}-${i}`} className={i % 2 === 1 ? "bg-surface-hover/50" : undefined}>
                <td className="px-3 py-1.5 text-muted">{move.label}</td>
                <td className="px-3 py-1.5 text-right font-medium text-accent">
                  {move.valuesByLevel[level - 1] ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
