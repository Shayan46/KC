import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Koundinya Capital | Private Wealth Management",
  description:
    "Disciplined private investment and wealth management focused on preserving capital and building long-term wealth.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
