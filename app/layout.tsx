import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DynaSport Live Football",
  description: "Automated live football updates for DynaSport",
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
