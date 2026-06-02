const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const shortDateFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const monthNameFormatter = new Intl.DateTimeFormat("th-TH", { month: "long" });

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDate(value: string): string {
  return shortDateFormatter.format(new Date(`${value}T00:00:00`));
}

export function getMonthName(month: number): string {
  return monthNameFormatter.format(new Date(2026, month - 1, 1));
}
