"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound, Plus, UserCog, UserMinus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ModernSelect } from "@/components/ui/modern-select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "@/hooks/use-users";
import { apiClient } from "@/lib/api-client";
import { getRoleLabel } from "@/lib/access-control";
import type { UserManagementUser } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

type UserFormState = {
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER";
  isActive: "true" | "false";
  password: string;
  confirmPassword: string;
};

const emptyUserForm: UserFormState = {
  name: "",
  email: "",
  role: "CASHIER",
  isActive: "true",
  password: "",
  confirmPassword: "",
};

export default function SettingsPage() {
  const { token, user, logout, setAuthUser } = useAuth();
  const { pushToast } = useToast();
  const router = useRouter();
  const { users, isLoading: isUsersLoading, error: usersError, refetch } = useUsers(token);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagementUser | null>(null);
  const [selectedPasswordUser, setSelectedPasswordUser] = useState<UserManagementUser | null>(null);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  const userSummary = useMemo(() => {
    const totalAdmins = users.filter((item) => item.role === "ADMIN").length;
    const totalCashiers = users.filter((item) => item.role === "CASHIER").length;
    const totalInactive = users.filter((item) => !item.isActive).length;

    return {
      totalAdmins,
      totalCashiers,
      totalInactive,
    };
  }, [users]);

  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setUserDialogOpen(true);
  };

  const openEditUser = (targetUser: UserManagementUser) => {
    setEditingUser(targetUser);
    setUserForm({
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      isActive: String(targetUser.isActive) as "true" | "false",
      password: "",
      confirmPassword: "",
    });
    setUserDialogOpen(true);
  };

  const openResetPassword = (targetUser: UserManagementUser) => {
    setSelectedPasswordUser(targetUser);
    setResetPassword("");
    setResetConfirmPassword("");
    setPasswordDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!token) {
      return;
    }

    setIsSavingProfile(true);

    try {
      const updatedUser = await apiClient.patch<{
        id: string;
        name: string;
        email: string;
        role: "ADMIN" | "CASHIER";
        isActive: boolean;
      }>("/users/me", { name, email, password: password || undefined }, token);

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
      setIsSavingProfile(false);
    }
  };

  const handleSaveUser = async () => {
    if (!token) {
      return;
    }

    if (!userForm.name.trim() || !userForm.email.trim()) {
      pushToast({
        type: "error",
        title: "Incomplete form",
        description: "Name and email are required.",
      });
      return;
    }

    if (!editingUser) {
      if (!userForm.password) {
        pushToast({
          type: "error",
          title: "Password required",
          description: "Password is required when creating a user.",
        });
        return;
      }

      if (userForm.password !== userForm.confirmPassword) {
        pushToast({
          type: "error",
          title: "Password mismatch",
          description: "Password and confirm password must match.",
        });
        return;
      }
    }

    setIsSubmittingUser(true);

    try {
      if (editingUser) {
        await apiClient.put(
          `/users/${editingUser.id}`,
          {
            name: userForm.name,
            email: userForm.email,
            role: userForm.role,
          },
          token
        );

        const nextActive = userForm.isActive === "true";
        if (editingUser.isActive !== nextActive) {
          await apiClient.patch(`/users/${editingUser.id}/status`, { isActive: nextActive }, token);
        }
      } else {
        await apiClient.post(
          "/users",
          {
            name: userForm.name,
            email: userForm.email,
            password: userForm.password,
            role: userForm.role,
            isActive: userForm.isActive === "true",
          },
          token
        );
      }

      await refetch();
      setUserDialogOpen(false);
      setEditingUser(null);
      setUserForm(emptyUserForm);

      pushToast({
        type: "success",
        title: editingUser ? "User updated" : "User created",
        description: editingUser ? "User data has been updated." : "New user account is ready to use.",
      });
    } catch (saveError) {
      pushToast({
        type: "error",
        title: editingUser ? "Update failed" : "Create failed",
        description: saveError instanceof Error ? saveError.message : "Unable to save user.",
      });
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token || !selectedPasswordUser) {
      return;
    }

    if (!resetPassword) {
      pushToast({
        type: "error",
        title: "Password required",
        description: "Please enter a new password.",
      });
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      pushToast({
        type: "error",
        title: "Password mismatch",
        description: "Password and confirm password must match.",
      });
      return;
    }

    setIsResettingPassword(true);

    try {
      await apiClient.patch(`/users/${selectedPasswordUser.id}/password`, { password: resetPassword }, token);
      setPasswordDialogOpen(false);
      setSelectedPasswordUser(null);
      setResetPassword("");
      setResetConfirmPassword("");
      pushToast({
        type: "success",
        title: "Password reset",
        description: "User password has been updated safely.",
      });
    } catch (resetError) {
      pushToast({
        type: "error",
        title: "Reset failed",
        description: resetError instanceof Error ? resetError.message : "Unable to reset password.",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleToggleStatus = async (targetUser: UserManagementUser) => {
    if (!token) {
      return;
    }

    setStatusUpdatingId(targetUser.id);

    try {
      await apiClient.patch(`/users/${targetUser.id}/status`, { isActive: !targetUser.isActive }, token);
      await refetch();
      pushToast({
        type: "success",
        title: targetUser.isActive ? "User deactivated" : "User activated",
        description: targetUser.isActive
          ? "User can no longer login until reactivated."
          : "User account is active again.",
      });
    } catch (statusError) {
      pushToast({
        type: "error",
        title: "Status update failed",
        description: statusError instanceof Error ? statusError.message : "Unable to change user status.",
      });
    } finally {
      setStatusUpdatingId(null);
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
      <Topbar
        title="Settings"
        subtitle="Kelola profil akun, preferensi operasional, dan akses user untuk memastikan area admin tetap aman."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-[#E8D8C3] bg-white">
          <CardHeader>
            <CardTitle>Store Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Input defaultValue="Galeh Kopi" />
            <Input defaultValue="Jl. Panglima Polim No. 28, Jakarta" />
            <Input defaultValue="+62 812-0000-1234" />
            <Textarea defaultValue="Warm neighborhood coffee bar with premium espresso and modern service flow." />
            <p className="text-sm text-[#5A4032]/65">
              These outlet settings are still UI placeholders because no persistence endpoint exists yet.
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E8D8C3] bg-white">
          <CardHeader>
            <CardTitle>Receipt Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Input defaultValue="Thank you for brewing your day with us." />
            <ModernSelect
              value="qris"
              onChange={() => {}}
              options={[
                { value: "qris", label: "Show QRIS logo" },
                { value: "simple", label: "Simple footer only" },
              ]}
            />
            <Textarea defaultValue="Follow us @kopikita for seasonal drink updates and loyalty rewards." />
          </CardContent>
        </Card>

        <Card className="border-[#E8D8C3] bg-white">
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Input defaultValue="manual" readOnly />
            <Input defaultValue="QRIS external barcode / cash" readOnly />
            <Textarea
              readOnly
              defaultValue="Sistem saat ini memakai CASH dan QRIS Manual. Midtrans tetap tidak aktif dan tidak dibutuhkan agar aplikasi berjalan."
            />
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Midtrans sengaja tidak diaktifkan. Pastikan kasir mengonfirmasi QRIS dari aplikasi merchant eksternal sebelum menyelesaikan pembayaran di POS.
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E8D8C3] bg-white">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email" />
            <Input value={getRoleLabel(user?.role)} readOnly />
            <Input
              type="password"
              placeholder="New password (optional)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <div className="flex gap-3 md:col-span-2 md:justify-end">
              <Button variant="secondary" onClick={handleLogout}>
                Logout
              </Button>
              <Button onClick={() => void handleSaveProfile()} disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#E8D8C3] bg-white">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <p className="mt-2 text-sm text-[#5A4032]/68">
                ADMIN dapat membuat akun kasir, mengatur role, reset password, dan menonaktifkan akun tanpa menghapus riwayat transaksi.
              </p>
            </div>
            <Button onClick={openCreateUser}>
              <UserPlus className="mr-2 h-4 w-4" /> Add Cashier
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-[#E8D8C3] bg-[#FDFBF7] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#5A4032]/45">Admin</p>
              <p className="mt-2 text-3xl font-semibold text-[#5A4032]">{userSummary.totalAdmins}</p>
            </div>
            <div className="rounded-[22px] border border-[#E8D8C3] bg-[#FDFBF7] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#5A4032]/45">Cashier</p>
              <p className="mt-2 text-3xl font-semibold text-[#5A4032]">{userSummary.totalCashiers}</p>
            </div>
            <div className="rounded-[22px] border border-[#E8D8C3] bg-[#FDFBF7] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#5A4032]/45">Inactive</p>
              <p className="mt-2 text-3xl font-semibold text-[#5A4032]">{userSummary.totalInactive}</p>
            </div>
          </div>

          {usersError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {usersError}
            </div>
          ) : null}

          <DataTable
            columns={[
              { key: "name", header: "Name", render: (row) => row.name },
              { key: "email", header: "Email", render: (row) => row.email },
              { key: "role", header: "Role", render: (row) => getRoleLabel(row.role) },
              {
                key: "status",
                header: "Status",
                render: (row) => <StatusBadge value={row.isActive ? "Active" : "Inactive"} />,
              },
              {
                key: "createdAt",
                header: "Created At",
                render: (row) => formatDateTime(row.createdAt),
              },
              {
                key: "actions",
                header: "Action",
                render: (row) => (
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditUser(row)}>
                      <UserCog className="mr-2 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => openResetPassword(row)}>
                      <KeyRound className="mr-2 h-3.5 w-3.5" /> Reset Password
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      onClick={() => void handleToggleStatus(row)}
                      disabled={statusUpdatingId === row.id || row.id === user?.id}
                      title={row.id === user?.id ? "You cannot deactivate your own account" : undefined}
                    >
                      <UserMinus className="mr-2 h-3.5 w-3.5" />
                      {statusUpdatingId === row.id
                        ? "Updating..."
                        : row.isActive
                          ? "Deactivate"
                          : "Activate"}
                    </Button>
                  </div>
                ),
              },
            ]}
            data={users}
            className={isUsersLoading ? "opacity-70" : ""}
            emptyMessage="Belum ada user lain di sistem."
          />
        </CardContent>
      </Card>

      <Dialog
        open={userDialogOpen}
        onOpenChange={(open) => {
          setUserDialogOpen(open);
          if (!open) {
            setEditingUser(null);
            setUserForm(emptyUserForm);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogTitle className="text-2xl font-semibold text-[#5A4032]">
            {editingUser ? "Edit User" : "Tambah User"}
          </DialogTitle>
          <DialogDescription className="text-[#5A4032]/68">
            {editingUser
              ? "Perbarui data user, role, dan status akun sesuai kebutuhan operasional."
              : "Buat akun baru untuk kasir atau admin dengan akses yang sesuai."}
          </DialogDescription>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-[#5A4032]">Name</label>
              <Input
                value={userForm.name}
                onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Full name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-[#5A4032]">Email</label>
              <Input
                value={userForm.email}
                onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="user@email.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#5A4032]">Role</label>
              <ModernSelect
                value={userForm.role}
                onChange={(value) =>
                  setUserForm((current) => ({ ...current, role: value as "ADMIN" | "CASHIER" }))
                }
                options={[
                  { value: "CASHIER", label: "Cashier" },
                  { value: "ADMIN", label: "Admin" },
                ]}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#5A4032]">Status</label>
              <ModernSelect
                value={userForm.isActive}
                onChange={(value) =>
                  setUserForm((current) => ({ ...current, isActive: value as "true" | "false" }))
                }
                options={[
                  { value: "true", label: "Active" },
                  { value: "false", label: "Inactive" },
                ]}
              />
            </div>

            {!editingUser ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#5A4032]">Password</label>
                  <Input
                    type="password"
                    value={userForm.password}
                    onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#5A4032]">Confirm Password</label>
                  <Input
                    type="password"
                    value={userForm.confirmPassword}
                    onChange={(event) =>
                      setUserForm((current) => ({ ...current, confirmPassword: event.target.value }))
                    }
                    placeholder="Repeat password"
                  />
                </div>
              </>
            ) : null}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveUser()} disabled={isSubmittingUser}>
              {isSubmittingUser ? "Saving..." : editingUser ? "Save User" : "Create User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={passwordDialogOpen}
        onOpenChange={(open) => {
          setPasswordDialogOpen(open);
          if (!open) {
            setSelectedPasswordUser(null);
            setResetPassword("");
            setResetConfirmPassword("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogTitle className="text-2xl font-semibold text-[#5A4032]">Reset Password</DialogTitle>
          <DialogDescription className="text-[#5A4032]/68">
            Set password baru untuk {selectedPasswordUser?.name ?? "user"} tanpa menampilkan password lama.
          </DialogDescription>
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#5A4032]">New Password</label>
              <Input
                type="password"
                value={resetPassword}
                onChange={(event) => setResetPassword(event.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#5A4032]">Confirm New Password</label>
              <Input
                type="password"
                value={resetConfirmPassword}
                onChange={(event) => setResetConfirmPassword(event.target.value)}
                placeholder="Repeat password"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleResetPassword()} disabled={isResettingPassword}>
              {isResettingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
