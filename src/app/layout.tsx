import type { Metadata } from "next";
import { JetBrains_Mono, Crimson_Pro } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const crimsonPro = Crimson_Pro({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MicroGPT Explainer | Understanding GPT in 243 Lines",
  description: "An interactive visual explainer for Karpathy's MicroGPT - a complete GPT implementation in 243 lines of pure Python. Explore the autograd engine, attention mechanism, and training loop.",
  keywords: ["GPT", "transformer", "machine learning", "neural networks", "autograd", "attention", "karpathy"],
  authors: [{ name: "Built with Claude" }],
  openGraph: {
    title: "MicroGPT Explainer | Understanding GPT in 243 Lines",
    description: "An interactive visual explainer for Karpathy's MicroGPT",
    type: "website",
    url: "https://microgpt-explainer.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "MicroGPT Explainer",
    description: "Interactive explainer for Karpathy's 243-line GPT implementation",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrainsMono.variable} ${crimsonPro.variable} antialiased bg-stone-950 text-amber-50`}
      >
        {children}
      </body>
    </html>
  );
}
