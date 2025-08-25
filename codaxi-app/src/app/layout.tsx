import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { HealthCheck } from "@/components/health-check";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Codaxi - AI-Powered Documentation Generator",
  description: "Real-time, RAG-powered documentation generator for codebases",
  icons: {
    icon: '/favicon.png?v=1',
    apple: '/favicon.png?v=1'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <HealthCheck />
          {children}
        </Providers>
      </body>
    </html>
  );
}
