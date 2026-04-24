"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Coffee } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const { login, isAuthenticated, isLoggingIn, authError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("admin@kopikita.local");
  const [password, setPassword] = useState("Admin123!");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(next);
    }
  }, [isAuthenticated, next, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      await login(email, password);
      router.replace(next);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fffdf9] via-[#f9f2e7] to-[#edd8c0] px-4 py-10">
      <Card className="w-full max-w-[980px] overflow-hidden p-0">
        <div className="grid min-h-[620px] md:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden bg-gradient-to-br from-coffee-900 via-coffee-700 to-coffee-500 p-10 text-white md:flex md:flex-col md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/15 p-3">
                <Coffee className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">POS Suite</p>
                <h1 className="text-2xl font-semibold">Kopi Kita</h1>
              </div>
            </div>
            <div>
              <h2 className="max-w-sm text-4xl font-semibold leading-tight">Warm operations for a fast-moving coffee bar.</h2>
              <p className="mt-4 max-w-md text-sm text-white/75">
                Login to access cashier workflow, live transactions, QRIS checkout, and receipt delivery in one modern control room.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center bg-[#fffdf9] p-6 md:p-10">
            <div className="w-full max-w-md">
              <CardHeader className="px-0 pt-0">
                <p className="text-xs uppercase tracking-[0.22em] text-coffee-700/45">Sign In</p>
                <CardTitle className="mt-2 text-4xl">Welcome back</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-coffee-900">Email</label>
                    <Input value={email} onChange={(event) => setEmail(event.target.value)} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-coffee-900">Password</label>
                    <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                  </div>
                  {(formError || authError) ? (
                    <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError || authError}</div>
                  ) : null}
                  <div className="rounded-2xl bg-cream-50 p-4 text-sm text-coffee-700/75">
                    <p>Admin demo: `admin@kopikita.local` / `Admin123!`</p>
                    <p className="mt-1">Cashier demo: `cashier@kopikita.local` / `Cashier123!`</p>
                  </div>
                  <Button className="w-full" size="lg" disabled={isLoggingIn}>
                    {isLoggingIn ? "Signing in..." : "Login to Dashboard"}
                  </Button>
                </form>
              </CardContent>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
