import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Manrope } from "next/font/google";

import { AuthProvider } from "@/hooks/use-auth";
import { ToastProvider } from "@/hooks/use-toast";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Coffee Shop POS",
  description: "Modern cashier dashboard for coffee shop operations.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${manrope.variable} font-[var(--font-body)]`}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
