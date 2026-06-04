"use client";

import { useMemo, useState } from "react";
import { Copy, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { WhatsAppReceiptOrder } from "@/lib/whatsapp-receipt";
import { getReceiptUrls, isValidWhatsAppPhone, openWhatsAppReceipt } from "@/lib/whatsapp-receipt";

export function WhatsAppReceiptButton({
  order,
  size = "sm",
  variant = "outline",
}: {
  order: WhatsAppReceiptOrder;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "secondary" | "outline" | "ghost";
}) {
  const { pushToast } = useToast();
  const [manualPhone, setManualPhone] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { receiptUrl } = useMemo(() => getReceiptUrls(order), [order]);

  const handleOpen = (phone?: string | null) => {
    const opened = openWhatsAppReceipt(order, phone);

    if (!opened) {
      setIsDialogOpen(true);
      if (phone) {
        setManualPhone(phone);
      }
      return;
    }

    setIsDialogOpen(false);
    pushToast({ type: "success", title: "WhatsApp opened", description: "Pesan receipt sudah disiapkan." });
  };

  const handleManualSend = () => {
    if (!isValidWhatsAppPhone(manualPhone)) {
      pushToast({ type: "error", title: "Nomor tidak valid", description: "Gunakan nomor WhatsApp Indonesia, contoh 08123456789." });
      return;
    }

    handleOpen(manualPhone);
  };

  const handleCopy = async () => {
    if (!receiptUrl) {
      pushToast({ type: "error", title: "Receipt belum tersedia", description: "Order ini belum memiliki receipt link." });
      return;
    }

    await navigator.clipboard.writeText(receiptUrl);
    pushToast({ type: "success", title: "Receipt link copied", description: "Link receipt siap dikirim manual." });
  };

  return (
    <>
      <Button type="button" size={size} variant={variant} onClick={() => handleOpen(order.customerPhone)}>
        <Send className="mr-2 h-4 w-4" /> Send to WhatsApp
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-2xl font-semibold text-coffee-900">Send Receipt</DialogTitle>
          <DialogDescription className="text-coffee-700/70">
            Masukkan nomor WhatsApp customer untuk membuka pesan receipt otomatis.
          </DialogDescription>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-coffee-900">Nomor WhatsApp customer</label>
              <Input value={manualPhone} onChange={(event) => setManualPhone(event.target.value)} placeholder="Contoh: 08123456789" />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={handleManualSend}>
                <Send className="mr-2 h-4 w-4" /> Send to WhatsApp
              </Button>
              <Button className="flex-1" variant="secondary" onClick={() => void handleCopy()}>
                <Copy className="mr-2 h-4 w-4" /> Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
