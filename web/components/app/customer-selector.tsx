"use client";

import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ModernSelect } from "@/components/ui/modern-select";
import { Textarea } from "@/components/ui/textarea";
import { useCustomers } from "@/hooks/use-customers";
import { apiClient } from "@/lib/api-client";
import type { Customer } from "@/lib/types";

type CustomerCreateForm = {
  name: string;
  phone: string;
  email: string;
  notes: string;
};

const emptyForm: CustomerCreateForm = {
  name: "",
  phone: "",
  email: "",
  notes: "",
};

export function CustomerSelector({
  token,
  selectedCustomerId,
  onSelectCustomer,
  onCustomerCreated,
}: {
  token: string | null;
  selectedCustomerId: string | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onCustomerCreated?: (customer: Customer) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CustomerCreateForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const { customers, isLoading, refetch } = useCustomers(token, query);

  const options = useMemo(
    () => [
      { value: "walk-in", label: "Walk-in Customer" },
      ...customers.map((customer) => ({
        value: customer.id,
        label: customer.phone ? `${customer.name} • ${customer.phone}` : customer.name,
      })),
    ],
    [customers],
  );

  const handleCreate = async () => {
    if (!token) {
      return;
    }

    setIsSaving(true);

    try {
      const created = await apiClient.post<Customer>("/customers", form, token);
      await refetch();
      onSelectCustomer(created);
      onCustomerCreated?.(created);
      setForm(emptyForm);
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const currentValue = selectedCustomerId ?? "walk-in";

  return (
    <div className="space-y-3 rounded-[22px] border border-coffee-100 bg-[#fffdfa] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-coffee-700" />
          <div>
            <p className="text-sm font-semibold text-coffee-900">Customer</p>
            <p className="text-xs text-coffee-700/65">Optional. Default tetap walk-in customer.</p>
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Quick Add
        </Button>
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search customer by name or phone"
        className="bg-[#fcf7f0]"
      />

      <ModernSelect
        value={currentValue}
        placeholder={isLoading ? "Loading customers..." : "Choose customer"}
        options={options}
        onChange={(value) => {
          if (value === "walk-in") {
            onSelectCustomer(null);
            return;
          }

          const customer = customers.find((item) => item.id === value) ?? null;
          onSelectCustomer(customer);
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg border-[#ead9c7] bg-[#fffdf9]">
          <DialogTitle className="text-2xl font-semibold text-coffee-900">Quick Create Customer</DialogTitle>
          <DialogDescription className="text-coffee-700/70">
            Simpan customer baru tanpa menghambat alur kasir.
          </DialogDescription>
          <div className="grid gap-4">
            <Input placeholder="Customer name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            <Input placeholder="Phone (optional)" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            <Input placeholder="Email (optional)" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            <Textarea placeholder="Notes (optional)" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-[96px] bg-[#fcf7f0]" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleCreate()} disabled={isSaving || form.name.trim().length < 2}>
              {isSaving ? "Saving..." : "Create Customer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
