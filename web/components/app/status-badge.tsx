import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-rose-100 text-rose-700",
  expired: "bg-slate-100 text-slate-700",
  cancelled: "bg-rose-100 text-rose-700",
  draft: "bg-slate-100 text-slate-700",
  pending_payment: "bg-amber-100 text-amber-700",
  low: "bg-rose-100 text-rose-700",
  healthy: "bg-emerald-100 text-emerald-700",
  available: "bg-emerald-100 text-emerald-700",
  "sold out": "bg-slate-200 text-slate-700",
};

export function StatusBadge({ value }: { value: string }) {
  const key = value.toLowerCase();
  return <Badge className={cn("capitalize", styles[key] ?? "bg-cream-100 text-coffee-800")}>{value.replaceAll("_", " ")}</Badge>;
}
