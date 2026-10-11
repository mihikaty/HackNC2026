import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "ctrl + alt + study",
  description:
    "A Frutiger Aero desktop of study tools and outdoor breaks for UNC students, with Sprout, your study companion.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
