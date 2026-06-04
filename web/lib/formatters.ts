export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatPaymentMethod(value?: string | null) {
  if (!value) {
    return "-";
  }

  if (value === "QRIS") {
    return "QRIS Manual";
  }

  if (value === "CASH") {
    return "Cash";
  }

  return value;
}

export function formatOrderStatus(value?: string | null) {
  if (!value) {
    return "-";
  }

  return value.replaceAll("_", " ");
}

export function formatPaymentStatus(value?: string | null) {
  return value ?? "-";
}
