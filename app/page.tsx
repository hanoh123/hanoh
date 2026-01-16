import { TrendingTickers } from "@/components/home/trending-tickers";
import { LatestCatalysts } from "@/components/home/latest-catalysts";
import { NewsTimeline } from "@/components/home/news-timeline";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-10 space-y-16">

      {/* World Intro */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          Enter the Penny Stocks World
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Choose your path. Every stock is a dungeon. Every catalyst is a battle.
        </p>
      </section>

      {/* Portals */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link
          href="/nasdaq"
          className="group border rounded-xl p-8 hover:scale-[1.02] transition bg-gradient-to-br from-blue-900/40 to-blue-700/20"
        >
          <h2 className="text-2xl font-semibold mb-2">NASDAQ Portal</h2>
          <p className="text-sm opacity-80">
            Regulated penny stocks. Safer dungeons. Faster trades.
          </p>
        </Link>

        <Link
          href="/otc"
          className="group border rounded-xl p-8 hover:scale-[1.02] transition bg-gradient-to-br from-red-900/40 to-red-700/20"
        >
          <h2 className="text-2xl font-semibold mb-2">OTC Portal</h2>
          <p className="text-sm opacity-80">
            High risk. High reward. Enter only if you’re ready.
          </p>
        </Link>
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
  );
}
