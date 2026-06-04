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
    <Card className="rounded-[20px] bg-white/96 shadow-[0_14px_32px_rgba(90,64,50,0.05)] sm:rounded-[26px]">
      <CardHeader className="p-3.5 pb-2 sm:p-5 sm:pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[#5A4032]/68 sm:text-sm">{title}</p>
            <CardTitle className="mt-1.5 truncate text-[22px] font-semibold leading-tight tracking-tight text-[#5A4032] sm:mt-2 sm:text-[28px]">{value}</CardTitle>
          </div>
          <div className="shrink-0 rounded-xl border border-[#E8D8C3] bg-[#FDFBF7] p-2 text-[#5A4032] sm:rounded-2xl sm:p-2.5">
            <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-2 px-3.5 pb-3.5 sm:gap-3 sm:px-5 sm:pb-5">
        <p className="min-w-0 truncate text-xs text-[#5A4032]/68 sm:text-sm">{hint}</p>
        <span className="shrink-0 rounded-full border border-[#E8D8C3] bg-[#FDFBF7] px-2 py-0.5 text-[11px] font-semibold text-[#5A4032] sm:px-2.5 sm:py-1 sm:text-xs">{trend}</span>
      </CardContent>
    </Card>
  );
}
