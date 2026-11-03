import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEchoBySlug } from "@/lib/db/queries";
import { RarityStars } from "@/components/RarityStars";
import { getImagePath } from "@/lib/images";
import { SKIN_LABEL } from "@/lib/echoVariants";

export async function generateMetadata({
  params,
}: PageProps<"/echoes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEchoBySlug(slug);
  return { title: data?.echo.name ?? "Echo" };
}

export default async function EchoDetailPage({ params }: PageProps<"/echoes/[slug]">) {
  const { slug } = await params;
  const data = await getEchoBySlug(slug);
  if (!data) notFound();

  const { echo, sets, variants } = data;
  const imageSrc = getImagePath("echoes", echo.slug);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center gap-5">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-surface">
          {imageSrc ? (
            <Image src={imageSrc} alt={echo.name} fill className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-2xl font-semibold text-muted">
              {echo.name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{echo.name}</h1>
          <div className="mt-1 text-sm text-muted">Cost {Number(echo.cost)}</div>
          <div className="mt-1">
            <RarityStars rarity={echo.rarity} />
          </div>
        </div>
      </div>

      {variants.length > 1 && (
        <div className="mt-6 flex gap-2">
          {variants.map((v) => (
            <Link
              key={v.skin}
              href={`/echoes/${v.slug}`}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                v.slug === echo.slug
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {SKIN_LABEL[v.skin]}
            </Link>
          ))}
        </div>
      )}

      {echo.skillDescription && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Skill</h2>
          <div className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm whitespace-pre-line text-muted">
            {echo.skillDescription}
          </div>
        </section>
      )}

      {sets.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">
            {sets.length > 1 ? `Eligible Sonata Sets (${sets.length})` : "Sonata Set"}
          </h2>
          <div className="mt-4 space-y-3">
            {sets.map((set) => {
              const setIconSrc = getImagePath("sonata-sets", set.id);
              return (
                <div
                  key={set.id}
                  className="flex gap-3 rounded-xl border border-border bg-surface p-4 text-sm"
                >
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-surface-hover">
                    {setIconSrc && (
                      <Image
                        src={setIconSrc}
                        alt={set.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{set.name}</div>
                    {set.onePieceEffect && (
                      <div className="mt-1 text-muted">1-pc: {set.onePieceEffect}</div>
                    )}
                    {set.twoPieceEffect && (
                      <div className="mt-1 text-muted">2-pc: {set.twoPieceEffect}</div>
                    )}
                    {set.threePieceEffect && (
                      <div className="mt-1 text-muted">3-pc: {set.threePieceEffect}</div>
                    )}
                    {set.fivePieceEffect && (
                      <div className="mt-1 text-muted">5-pc: {set.fivePieceEffect}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
