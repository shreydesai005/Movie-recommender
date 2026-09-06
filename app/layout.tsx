import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maanu's Surprise",
  description:
    "Stop scrolling. Start watching. Discover 5 great movies or series on Netflix and Prime Video India.",
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