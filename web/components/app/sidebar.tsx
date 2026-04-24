"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, LayoutDashboard, Package, ReceiptText, ScrollText, Settings, ShoppingBasket, ShoppingCart, Wallet } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { sidebarNavigation } from "@/lib/mock-data";

const icons = [LayoutDashboard, ShoppingCart, Coffee, Package, ScrollText, Wallet, ReceiptText, Settings];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <Card className="sticky top-6 hidden h-[calc(100vh-3rem)] min-h-[780px] w-[280px] flex-col justify-between bg-[#fffaf2] p-5 lg:flex">
      <div>
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="rounded-2xl bg-coffee-700 p-3 text-white">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-coffee-700/50">POS Suite</p>
            <h1 className="text-xl font-semibold text-coffee-900">Kopi Kita</h1>
          </div>
        </div>
        <nav className="space-y-2">
          {sidebarNavigation.map((item, index) => {
            const Icon = icons[index];
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive ? "bg-coffee-700 text-white shadow-soft" : "text-coffee-800 hover:bg-cream-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="rounded-[24px] bg-coffee-900 p-5 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Shift status</p>
        <p className="mt-2 text-lg font-semibold">Morning shift active</p>
        <p className="mt-2 text-sm text-white/70">2 cashier online, 1 manager reviewing reports.</p>
      </div>
    </Card>
  );
}
