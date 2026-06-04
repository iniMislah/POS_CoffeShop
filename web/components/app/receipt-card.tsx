import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type ReceiptItem = {
  id?: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal?: number;
  modifiers?: Array<{
    id?: string;
    name: string;
    price: number;
  }>;
  notes?: string | null;
};

export function ReceiptCard({
  storeName,
  invoiceNumber,
  date,
  cashierName,
  customerName,
  items,
  subtotal,
  service = 0,
  total,
  paymentMethod,
  paymentStatus,
  amountReceived,
  changeAmount,
}: {
  storeName: string;
  invoiceNumber: string;
  date: string;
  cashierName?: string | null;
  customerName?: string | null;
  items: ReceiptItem[];
  subtotal: number;
  service?: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  amountReceived?: number | null;
  changeAmount?: number | null;
}) {
  return (
    <Card className="mx-auto w-full max-w-2xl overflow-hidden border-[#ead9c7] bg-[#fffdf9] shadow-[0_24px_80px_rgba(58,35,22,0.12)]">
      <div className="bg-[linear-gradient(135deg,#5a3e2b_0%,#7a553d_100%)] px-8 py-8 text-white">
        <p className="text-xs uppercase tracking-[0.24em] text-white/70">Digital Receipt</p>
        <h2 className="mt-2 text-3xl font-semibold">GALEH KOPI</h2>
        <div className="mt-4 grid gap-3 text-sm text-white/85 md:grid-cols-2">
          <p>Invoice: {invoiceNumber}</p>
          <p>Date: {formatDateTime(date)}</p>
          <p>Cashier: {cashierName || "-"}</p>
          <p>Customer: {customerName || "Walk-in Customer"}</p>
          <p>Payment: {paymentMethod}</p>
        </div>
      </div>

      <CardContent className="space-y-6 px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-[#f8efe5] px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-coffee-700/55">Payment Status</p>
            <p className="mt-1 text-lg font-semibold text-coffee-950">{paymentStatus}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-coffee-700/55">Total</p>
            <p className="mt-1 text-xl font-semibold text-coffee-950">{formatCurrency(total)}</p>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id ?? `${item.name}-${item.qty}`} className="rounded-[22px] border border-coffee-100 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-coffee-950">{item.name}</p>
                  <p className="mt-1 text-sm text-coffee-700/68">
                    {item.qty} x {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <p className="font-semibold text-coffee-950">
                  {formatCurrency(item.lineTotal ?? item.qty * item.unitPrice)}
                </p>
              </div>

              {item.modifiers && item.modifiers.length > 0 ? (
                <div className="mt-3 space-y-1 rounded-2xl bg-[#fcf7f0] px-4 py-3 text-sm text-coffee-700/72">
                  {item.modifiers.map((modifier) => (
                    <p key={modifier.id ?? `${item.name}-${modifier.name}`}>
                      + {modifier.name} ({formatCurrency(modifier.price)})
                    </p>
                  ))}
                </div>
              ) : null}

              {item.notes ? <p className="mt-3 text-sm text-coffee-700/68">Note: {item.notes}</p> : null}
            </div>
          ))}
        </div>

        <div className="rounded-[24px] bg-[#f8efe5] px-5 py-5">
          <div className="flex items-center justify-between text-sm text-coffee-700/75">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {service > 0 ? (
            <div className="mt-3 flex items-center justify-between text-sm text-coffee-700/75">
              <span>Service</span>
              <span>{formatCurrency(service)}</span>
            </div>
          ) : null}
          <div className="mt-4 flex items-center justify-between border-t border-coffee-200 pt-4 text-base font-semibold text-coffee-950">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {amountReceived ? (
            <div className="mt-3 flex items-center justify-between text-sm text-coffee-700/75">
              <span>Amount Received</span>
              <span>{formatCurrency(amountReceived)}</span>
            </div>
          ) : null}
          {changeAmount ? (
            <div className="mt-3 flex items-center justify-between text-sm text-coffee-700/75">
              <span>Change</span>
              <span>{formatCurrency(changeAmount)}</span>
            </div>
          ) : null}
        </div>

        <div className="rounded-[22px] border border-dashed border-coffee-200 bg-[#fffaf4] px-5 py-4 text-center">
          <p className="font-semibold text-coffee-900">Thank you for your purchase</p>
          <p className="mt-1 text-sm text-coffee-700/70">Scan QR / save this receipt for your records</p>
        </div>
      </CardContent>
    </Card>
  );
}
