import type { Metadata } from "next";
import "@/app/globals.css";
import { AppProviders } from "@/src/app/providers/app-providers";

export const metadata: Metadata = {
  title: "AuditTrail",
  description: "AuditTrail event monitoring workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
