"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isInitializing, pathname, router]);

  if (isInitializing) {
    return (
      <Card className="m-6">
        <CardHeader>
          <CardTitle>Preparing your workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-cream-200" />
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-cream-200" />
          <div className="h-32 animate-pulse rounded-[24px] bg-cream-100" />
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
