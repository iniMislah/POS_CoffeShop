import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export function ReceiptCard({
  storeName,
  invoiceNumber,
  date,
  items,
  subtotal,
  tax,
  service,
  total,
  paymentMethod,
  status,
}: {
  storeName: string;
  invoiceNumber: string;
  date: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  tax: number;
  service: number;
  total: number;
  paymentMethod: string;
  status: string;
}) {
  return (
    <Card className="mx-auto w-full max-w-xl bg-white">
      <CardHeader className="border-b border-coffee-100">
        <p className="text-xs uppercase tracking-[0.2em] text-coffee-700/45">Digital Receipt</p>
        <CardTitle className="mt-2 text-3xl">{storeName}</CardTitle>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-coffee-700/65">
          <span>{invoiceNumber}</span>
          <span className="h-1 w-1 rounded-full bg-coffee-300" />
          <span>{formatDateTime(date)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-coffee-900">{item.name}</p>
                <p className="text-sm text-coffee-700/60">{item.qty} x {formatCurrency(item.price)}</p>
              </div>
              <span className="font-semibold text-coffee-900">{formatCurrency(item.qty * item.price)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 rounded-2xl bg-cream-50 p-4 text-sm">
          <div className="flex justify-between text-coffee-700/70"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between text-coffee-700/70"><span>Tax</span><span>{formatCurrency(tax)}</span></div>
          <div className="flex justify-between text-coffee-700/70"><span>Service</span><span>{formatCurrency(service)}</span></div>
          <div className="flex justify-between border-t border-coffee-100 pt-3 text-base font-semibold text-coffee-900"><span>Total</span><span>{formatCurrency(total)}</span></div>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-coffee-900 px-4 py-3 text-white">
          <span>{paymentMethod}</span>
          <span>{status}</span>
        </div>
      </CardContent>
    </Card>
  );
}
