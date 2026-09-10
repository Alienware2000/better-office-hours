import { Source_Sans_3 } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Better Office Hours",
  description:
    "A voice tutor that knows your course and talks you to the answer instead of handing it to you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className={sans.className}>{children}</body>
    </html>
  );
}
