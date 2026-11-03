import { ELEMENT_COLOR, ELEMENT_LABEL } from "@/lib/wuwa-visuals";

export function ElementBadge({ attribute }: { attribute: string }) {
  const color = ELEMENT_COLOR[attribute] ?? ELEMENT_COLOR.none;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}26`, color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {ELEMENT_LABEL[attribute] ?? attribute}
    </span>
  );
}
