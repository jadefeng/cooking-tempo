import Link from "next/link";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cooking Tempo",
  description: "Plan and cook meals in sync.",
  openGraph: {
    title: "Cooking Tempo",
    description: "Plan and cook meals in sync.",
    url: "https://cooking-tempo.jadefeng.com",
    siteName: "Cooking Tempo",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Cooking Tempo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cooking Tempo",
    description: "Plan and cook meals in sync.",
    images: ["/og-image.png"],
  },
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
                  className="flex items-center gap-2 font-display text-2xl text-stone-900 sm:text-3xl"
                  href="/meals"
                >
                  <img
                    src="/icon.png"
                    alt="Cooking Tempo"
                    className="h-8 w-8 rounded-xl bg-white object-contain"
                  />
                  <span>Cooking Tempo</span>
                </Link>
              </div>
              <nav className="flex flex-wrap gap-3 text-base font-semibold text-stone-800">
                <Link
                  className="border border-stone-300 bg-white px-5 py-3 transition hover:border-stone-500 hover:shadow-sm"
                  href="/recipes"
                >
                  Recipes
                </Link>
                <Link
                  className="border border-stone-300 bg-white px-5 py-3 transition hover:border-stone-500 hover:shadow-sm"
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
