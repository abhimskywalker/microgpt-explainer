import type { Metadata } from "next";
import { JetBrains_Mono, Crimson_Pro } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jetbrainsMono.variable} ${crimsonPro.variable} antialiased`}
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)',
        }}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
