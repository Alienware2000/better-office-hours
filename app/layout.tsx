import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Better Office Hours",
  description:
    "A voice tutor that knows your course and talks you to the answer instead of handing it to you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
