"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "info";
};

type ToastContextValue = {
  pushToast: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastStyles: Record<ToastItem["type"], string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-coffee-200 bg-white text-coffee-800",
};

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...toast, id }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type];

          return (
            <div key={toast.id} className={`pointer-events-auto rounded-[24px] border px-4 py-4 shadow-soft ${toastStyles[toast.type]}`}>
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.description ? <p className="mt-1 text-sm opacity-80">{toast.description}</p> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
