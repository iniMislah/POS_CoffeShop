"use client";

import { ShieldAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { getDefaultRouteForRole } from "@/lib/access-control";

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const fallbackRoute = getDefaultRouteForRole(user?.role);

  return (
    <div className="space-y-6">
      <Topbar
        title="Unauthorized"
        subtitle="Halaman ini membutuhkan izin yang tidak dimiliki akun yang sedang login."
      />

      <Card className="mx-auto max-w-3xl border-[#E8D8C3] bg-white">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="rounded-[22px] border border-[#E8D8C3] bg-[#FDFBF7] p-4 text-[#5A4032]">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <CardTitle className="text-2xl">Access restricted</CardTitle>
              <p className="mt-2 text-sm text-[#5A4032]/68">
                Akun kamu tidak punya izin untuk membuka halaman admin ini.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {from ? (
            <div className="rounded-[20px] border border-[#E8D8C3] bg-[#FDFBF7] px-5 py-4 text-sm text-[#5A4032]/72">
              Halaman yang ditolak: <span className="font-semibold text-[#5A4032]">{from}</span>
            </div>
          ) : null}

          <div className="rounded-[20px] border border-[#E8D8C3] bg-[#FDFBF7] px-5 py-4 text-sm text-[#5A4032]/72">
            Jika kamu membutuhkan akses tambahan, minta ADMIN untuk memperbarui role user kamu.
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => router.back()}>
              Kembali
            </Button>
            <Button onClick={() => router.replace(fallbackRoute)}>
              Buka Halaman Utama Saya
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
