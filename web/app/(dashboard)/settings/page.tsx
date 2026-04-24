"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

export default function SettingsPage() {
  const { token, user, logout, setAuthUser } = useAuth();
  const { pushToast } = useToast();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  const handleSave = async () => {
    if (!token) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedUser = await apiClient.patch<{ id: string; name: string; email: string; role: "ADMIN" | "CASHIER" }>("/users/me", { name, email, password: password || undefined }, token);
      setAuthUser(updatedUser);
      pushToast({
        type: "success",
        title: "Profile updated",
        description: "Your account data has been saved.",
      });
      setPassword("");
    } catch (saveError) {
      pushToast({
        type: "error",
        title: "Save failed",
        description: saveError instanceof Error ? saveError.message : "Unable to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    pushToast({
      type: "success",
      title: "Logged out",
    });
    router.replace("/login");
  };

  return (
    <div className="space-y-6">
      <Topbar title="Settings" subtitle="Profile and operational preferences with working account actions for MVP administration." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Outlet Profile</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <Input defaultValue="Kopi Kita Signature" />
            <Input defaultValue="Jl. Panglima Polim No. 28, Jakarta" />
            <Input defaultValue="+62 812-0000-1234" />
            <Textarea defaultValue="Warm neighborhood coffee bar with premium espresso and modern service flow." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Receipt Settings</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <Input defaultValue="Thank you for brewing your day with us." />
            <Select defaultValue="qris">
              <option value="qris">Show QRIS logo</option>
              <option value="simple">Simple footer only</option>
            </Select>
            <Textarea defaultValue="Follow us @kopikita for seasonal drink updates and loyalty rewards." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tax & Service</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input defaultValue="10" />
            <Input defaultValue="5" />
            <Select defaultValue="rounded">
              <option value="rounded">Rounded total</option>
              <option value="exact">Exact decimal</option>
            </Select>
            <Select defaultValue="inclusive">
              <option value="inclusive">Inclusive display</option>
              <option value="exclusive">Exclusive display</option>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Payment Gateway</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <Input defaultValue="mock-qris" />
            <Input defaultValue="gateway-key-placeholder" />
            <Textarea defaultValue="Provider adapter ready. Replace mock service with real Midtrans/Xendit bridge later." />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>User Profile</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
          <Input value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input type="password" placeholder="New password (optional)" value={password} onChange={(event) => setPassword(event.target.value)} />
          <div className="flex gap-3 md:justify-end">
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
            <Button onClick={() => void handleSave()} disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
