import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SummaryCard({
  title,
  value,
  hint,
  trend,
}: {
  title: string;
  value: string;
  hint: string;
  trend: string;
}) {
  return (
    <Card className="bg-white/80">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-coffee-700/70">{title}</p>
            <CardTitle className="mt-2 text-3xl font-semibold tracking-tight">{value}</CardTitle>
          </div>
          <div className="rounded-2xl bg-cream-100 p-3 text-coffee-700">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <p className="text-sm text-coffee-700/70">{hint}</p>
        <span className="rounded-full bg-coffee-100 px-3 py-1 text-xs font-semibold text-coffee-700">{trend}</span>
      </CardContent>
    </Card>
  );
}
