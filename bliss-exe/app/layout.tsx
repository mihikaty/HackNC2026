import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito } from "next/font/google";
import "98.css/style.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Bliss.exe",
  description: "A little more focus. A little more outside.",
  icons: {
    icon: "/icons/screensaver.png",
    apple: "/icons/screensaver.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}