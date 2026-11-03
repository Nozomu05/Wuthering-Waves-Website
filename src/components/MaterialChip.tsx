import Image from "next/image";
import { getImagePath } from "@/lib/images";

export function MaterialChip({
  slug,
  name,
  quantity,
}: {
  slug: string;
  name: string;
  quantity: number;
}) {
  const imageSrc = getImagePath("materials", slug);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface py-1.5 pr-3 pl-1.5 text-sm">
      <div className="relative size-8 shrink-0 overflow-hidden rounded-md bg-surface-hover">
        {imageSrc && (
          <Image src={imageSrc} alt={name} fill sizes="32px" className="object-cover" />
        )}
      </div>
      <span>
        {name} ×{quantity}
      </span>
    </div>
  );
}
