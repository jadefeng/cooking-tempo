import Link from "next/link";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cooking Tempo",
  description: "A simple, focused recipe and meal planner MVP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen px-4 pb-16 pt-6 sm:px-8">
          <header className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-3xl border border-black/10 bg-white/70 px-6 py-5 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link
                  className="font-display text-2xl text-stone-900 sm:text-3xl"
                  href="/meals"
                >
                  Cooking Tempo
                </Link>
              </div>
              <nav className="flex flex-wrap gap-3 text-sm font-semibold text-stone-700">
                <Link
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 transition hover:border-stone-400"
                  href="/recipes"
                >
                  Recipes
                </Link>
                <Link
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 transition hover:border-stone-400"
                  href="/meals"
                >
                  Meals
                </Link>
              </nav>
            </div>
            <p className="text-sm text-stone-600">
              Capture ingredients, keep instructions tidy, and assemble meals
              with a few clicks.
            </p>
          </header>
          <main className="mx-auto mt-8 w-full max-w-5xl">{children}</main>
        </div>
      </body>
    </html>
  );
}
