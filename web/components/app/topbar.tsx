"use client";

import { LogOut, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getRoleLabel } from "@/lib/access-control";

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
    <div className="flex flex-col gap-3 rounded-[20px] border border-[#E8D8C3]/75 bg-white p-4 shadow-[0_14px_34px_rgba(90,64,50,0.06)] sm:rounded-[24px] sm:p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#5A4032]/42 sm:text-xs sm:tracking-[0.22em]">Coffee Shop Control</p>
        <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-[#5A4032] sm:mt-2 sm:text-3xl">{title}</h2>
        <p className="mt-1.5 max-w-2xl text-xs leading-snug text-[#5A4032]/68 sm:mt-2 sm:text-sm sm:leading-normal">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-[#E8D8C3] bg-[#FDFBF7] px-3 py-2 sm:gap-3 sm:px-4">
          <UserCircle2 className="h-7 w-7 shrink-0 text-[#5A4032] sm:h-9 sm:w-9" />
          <div>
            <p className="max-w-[160px] truncate text-sm font-semibold leading-tight text-[#5A4032]">{user?.name ?? "Coffee Crew"}</p>
            <p className="text-xs text-[#5A4032]/60">{getRoleLabel(user?.role)}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    </div>
  );
}
