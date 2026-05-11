import type { Metadata } from "next";
import { Black_Ops_One, Oswald, Open_Sans } from "next/font/google";
import "./globals.css";

const blackOps = Black_Ops_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-heading",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Moving Commander — The Complete Moving Company Management Solution",
  description:
    "Quoting, dispatch, and back-office for moving companies. Built by movers, for movers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${blackOps.variable} ${oswald.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-sand text-ink">
        {children}
      </body>
    </html>
  );
}
