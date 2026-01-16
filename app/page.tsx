import Link from "next/link";
import { TrendingTickers } from "@/components/home/trending-tickers";
import { LatestCatalysts } from "@/components/home/latest-catalysts";
import { NewsTimeline } from "@/components/home/news-timeline";

function PortalCard({
  href,
  title,
  subtitle,
  tag,
  icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  tag: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-[26px] border-4 border-black bg-white shadow-[10px_10px_0_#000] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[8px_8px_0_#000]"
    >
      <div className="relative overflow-hidden rounded-[20px]">
        {/* Top label */}
        <div className="absolute left-4 top-4 z-10 rounded-full border-2 border-black bg-yellow-200 px-3 py-1 text-xs font-black tracking-wide">
          {tag}
        </div>

        {/* “Cartoon window” header bar */}
        <div className="flex items-center justify-between border-b-4 border-black bg-sky-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-3 w-3 rounded-full border-2 border-black bg-red-300" />
            <span className="inline-flex h-3 w-3 rounded-full border-2 border-black bg-yellow-300" />
            <span className="inline-flex h-3 w-3 rounded-full border-2 border-black bg-green-300" />
          </div>
          <span className="text-xs font-black tracking-wide opacity-70">PORTAL</span>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-black">
                {title}
              </h2>
              <p className="mt-2 text-sm font-semibold text-black/70">
                {subtitle}
              </p>
            </div>

            {/* Placeholder “art” */}
            <div className="grid h-16 w-16 place-items-center rounded-2xl border-4 border-black bg-white shadow-[6px_6px_0_#000]">
              <span className="text-3xl">{icon}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border-4 border-black bg-lime-200 px-4 py-2 text-sm font-black shadow-[6px_6px_0_#000] transition group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-[5px_5px_0_#000]">
            Enter Dungeon
            <span aria-hidden>→</span>
          </div>
        </div>

        {/* Bottom “paper grain” vibe via subtle dots */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(#000 1px, transparent 1px)",
            backgroundSize: "12px 12px",
          }}
        />
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-sky-50">
      <div className="container mx-auto px-4 py-10 space-y-16">
        {/* World Intro */}
        <section className="text-center space-y-4">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border-4 border-black bg-white px-5 py-2 font-black shadow-[8px_8px_0_#000]">
            🎮 Game Mode
            <span className="text-black/60">•</span>
            Penny Stocks
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black">
            Enter the Penny Stocks World
          </h1>

          <p className="mx-auto max-w-2xl text-black/70 font-semibold">
            Choose your path. Every stock is a dungeon. Every catalyst is a battle.
          </p>
        </section>

        {/* Portals */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <PortalCard
            href="/nasdaq"
            title="NASDAQ Portal"
            subtitle="Cleaner data. Safer runs. Faster screening."
            tag="BEGINNER FRIENDLY"
            icon="🗝️"
          />
          <PortalCard
            href="/otc"
            title="OTC Portal"
            subtitle="Higher risk. Wilder moves. Treasure… or traps."
            tag="HARD MODE"
            icon="🧨"
          />
        </section>

        {/* Market Activity */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TrendingTickers />
          </div>
          <LatestCatalysts />
        </section>

        {/* News Timeline */}
        <section>
          <NewsTimeline />
        </section>
      </div>
    </div>
  );
}
