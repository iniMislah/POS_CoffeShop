import type { ReactNode } from "react";

import { AuthGuard } from "@/components/app/auth-guard";
import { Sidebar } from "@/components/app/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="page-shell min-h-screen p-4 lg:p-6">
        <div className="mx-auto flex max-w-[1680px] gap-6">
          <Sidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
