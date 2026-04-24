"use client";

import { LogOut } from "lucide-react";
import { Bell, Search, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function Topbar({ title, subtitle }: { title: string; subtitle: string }) {
  const { user, logout } = useAuth();
  const { pushToast } = useToast();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    pushToast({
      type: "success",
      title: "Logged out",
      description: "Session ended successfully.",
    });
    router.replace("/login");
  };

  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-coffee-700/45">Coffee Shop Control</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight text-coffee-900">{title}</h2>
        <p className="mt-1 text-sm text-coffee-700/70">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-[260px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-coffee-700/45" />
          <Input className="pl-10" placeholder="Search invoice, menu, ingredient..." />
        </div>
        <button className="rounded-2xl border border-coffee-300/25 bg-white p-3 text-coffee-700 transition hover:bg-cream-50">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 rounded-2xl bg-cream-50 px-4 py-2">
          <UserCircle2 className="h-9 w-9 text-coffee-700" />
          <div>
            <p className="text-sm font-semibold text-coffee-900">{user?.name ?? "Coffee Crew"}</p>
            <p className="text-xs text-coffee-700/60">{user?.role ?? "Guest"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    </div>
  );
}
