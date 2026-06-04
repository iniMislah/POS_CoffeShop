"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coffee,
  FolderTree,
  LayoutDashboard,
  Menu,
  Package,
  ReceiptText,
  ScrollText,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { sidebarNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const icons = [
  LayoutDashboard,
  ShoppingCart,
  Coffee,
  FolderTree,
  Users,
  Package,
  ScrollText,
  Wallet,
  ReceiptText,
  Settings,
];

function SidebarContent({
  pathname,
  onNavigate,
  userRole,
}: {
  pathname: string;
  onNavigate?: () => void;
  userRole?: "ADMIN" | "CASHIER";
}) {
  const visibleNavigation = sidebarNavigation.filter(
    (item) => !userRole || item.roles.includes(userRole)
  );
  const primaryNavigation = visibleNavigation.filter((item) => item.href !== "/settings");

  const settingsItem = visibleNavigation.find(
    (item) => item.href === "/settings"
  );

  return (
    <div className="flex h-full max-w-full flex-col overflow-x-hidden overflow-y-auto rounded-[24px] border border-[#E8D8C3] bg-[#F6F0E7] p-3 shadow-[0_22px_50px_rgba(90,64,50,0.10)] sm:rounded-[30px] sm:p-4">
      {/* Brand */}
      <div className="order-1 rounded-[20px] border border-[#E8D8C3]/80 bg-white p-3 pr-12 shadow-[0_14px_32px_rgba(90,64,50,0.07)] sm:rounded-[26px] sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] border border-[#E8D8C3] bg-[#FDFBF7] shadow-[0_10px_24px_rgba(90,64,50,0.08)] sm:h-[84px] sm:w-[84px] sm:rounded-[22px]">
            <Image
              src="/galeh-kopi-logo.jpeg"
              alt="GALEH KOPI logo"
              fill
              className="object-contain p-2"
              priority
            />
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#5A4032]/48 sm:text-[10px] sm:tracking-[0.28em]">
              POS Suite
            </p>

            <h1 className="mt-1 text-xl font-bold leading-tight text-[#5A4032] sm:text-[22px]">
              GALEH
              <br />
              KOPI
            </h1>

            <p className="mt-1 max-w-[145px] text-[10px] font-medium leading-snug text-[#5A4032]/68 sm:mt-1.5 sm:text-[11px]">
              Manggaleh Raso, Manyambuang Cerito
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="order-3 mt-3 rounded-[18px] border border-[#E8D8C3]/70 bg-[#FDFBF7] p-3 sm:mt-4 sm:rounded-[24px] sm:p-4 lg:order-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#5A4032]/48 sm:text-[10px] sm:tracking-[0.24em]">
          Mode Kadai
        </p>

        <p className="mt-1 text-sm font-bold text-[#5A4032] sm:mt-2 sm:text-base">
          Siap Melayani
        </p>

        <p className="mt-1 text-xs leading-snug text-[#5A4032]/72 sm:mt-2 sm:text-sm sm:leading-relaxed">
          Transaksi, menu, pelanggan, dan stok dalam satu alur kerja.
        </p>
      </div>

      {/* Navigation */}
      <nav className="order-2 mt-3 min-h-0 shrink-0 space-y-1 overflow-y-auto pr-1 sm:mt-5 sm:space-y-1.5 lg:order-3 lg:flex-1">
        {primaryNavigation.map((item) => {
          const index = visibleNavigation.findIndex(
            (navItem) => navItem.href === item.href
          );

          const Icon = icons[index] ?? Coffee;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-[16px] px-3 py-2.5 text-sm font-semibold transition-all duration-200 sm:min-h-12 sm:rounded-[20px] sm:px-4 sm:py-3",
                isActive
                  ? "bg-[#5A4032] text-white shadow-[0_12px_26px_rgba(90,64,50,0.18)]"
                  : "text-[#5A4032]/80 hover:bg-white/78 hover:text-[#5A4032]"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] transition sm:h-9 sm:w-9 sm:rounded-[14px]",
                  isActive
                    ? "bg-white/18 text-white"
                    : "bg-white/82 text-[#5A4032] group-hover:bg-white"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>

              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="order-4 mt-3 space-y-3 sm:mt-4">
        {settingsItem ? (
          <Link
            href={settingsItem.href}
            onClick={onNavigate}
            className={cn(
              "group flex min-h-11 items-center gap-3 rounded-[16px] px-3 py-2.5 text-sm font-semibold transition-all duration-200 sm:min-h-12 sm:rounded-[20px] sm:px-4 sm:py-3",
              pathname === settingsItem.href
                ? "bg-[#5A4032] text-white shadow-[0_12px_26px_rgba(90,64,50,0.18)]"
                : "bg-white/78 text-[#5A4032]/80 hover:bg-white hover:text-[#5A4032]"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] transition sm:h-9 sm:w-9 sm:rounded-[14px]",
                pathname === settingsItem.href
                  ? "bg-white/18 text-white"
                  : "bg-[#FDFBF7] text-[#5A4032] group-hover:bg-white"
              )}
            >
              <Settings className="h-4 w-4" />
            </span>

            <span>{settingsItem.title}</span>
          </Link>
        ) : null}

        <div className="rounded-[18px] border border-[#E8D8C3]/80 bg-white p-3 shadow-[0_10px_24px_rgba(90,64,50,0.06)] sm:rounded-[24px] sm:p-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#5A4032]/48 sm:text-[10px] sm:tracking-[0.22em]">
            Status Kedai
          </p>

          <p className="mt-1 text-sm font-bold text-[#5A4032] sm:mt-2 sm:text-base">
            Galeh Aktif
          </p>

          <p className="mt-1 text-xs leading-snug text-[#5A4032]/72 sm:mt-1.5 sm:leading-relaxed">
            Buka POS untuk transaksi dan pantau penjualan dari dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile / Tablet Toggle */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E8D8C3] bg-white text-[#5A4032] shadow-[0_12px_28px_rgba(90,64,50,0.12)] transition hover:bg-[#FDFBF7] lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden h-full w-[292px] shrink-0 lg:block">
        <SidebarContent pathname={pathname} userRole={user?.role} />
      </aside>

      {/* Mobile Overlay */}
      {open ? (
        <div className="fixed inset-0 z-[999] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#5A4032]/18 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar overlay"
          />

          <aside className="relative h-full w-[88vw] max-w-[360px] p-2 sm:p-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/92 text-[#5A4032] shadow-sm transition hover:bg-white sm:right-5 sm:top-5"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>

            <SidebarContent
              pathname={pathname}
              userRole={user?.role}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
