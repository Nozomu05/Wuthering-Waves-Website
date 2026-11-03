import Image from "next/image";
import Link from "next/link";
import { RarityStars } from "./RarityStars";

export function EntityCard({
  href,
  name,
  rarity,
  imageSrc,
  secondaryImageSrc,
  accentColor,
  meta,
}: {
  href: string;
  name: string;
  rarity: number;
  imageSrc: string | null;
  secondaryImageSrc?: string | null;
  accentColor?: string;
  meta: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-xl border border-border bg-surface transition hover:border-[var(--card-accent)]"
      style={{ "--card-accent": accentColor ?? "var(--accent)" } as React.CSSProperties}
    >
      <div className="relative aspect-square overflow-hidden bg-surface-hover">
        {imageSrc && secondaryImageSrc ? (
          <div className="flex size-full">
            <div className="relative h-full w-1/2 overflow-hidden">
              <Image
                src={imageSrc}
                alt={name}
                fill
                sizes="(min-width: 1024px) 110px, (min-width: 640px) 17vw, 25vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <div className="relative h-full w-1/2 overflow-hidden border-l border-black/30">
              <Image
                src={secondaryImageSrc}
                alt={name}
                fill
                sizes="(min-width: 1024px) 110px, (min-width: 640px) 17vw, 25vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        ) : imageSrc ? (
          <Image
            src={imageSrc}
            alt={name}
            fill
            sizes="(min-width: 1024px) 220px, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-3xl font-semibold text-muted">
            {name.charAt(0)}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute right-2 bottom-2">
          <RarityStars rarity={rarity} />
        </div>
      </div>
      <div className="p-3">
        <div className="truncate font-medium">{name}</div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted">{meta}</div>
      </div>
    </Link>
  );
}
