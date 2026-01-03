// Format currency in Indian Rupees
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format date to readable string
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Format date with time
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Calculate profit
export function calculateProfit(
  sellingPrice: number,
  purchasePrice: number,
  quantity: number
): number {
  return (sellingPrice - purchasePrice) * quantity;
}

// Calculate profit percentage
export function calculateProfitPercentage(
  sellingPrice: number,
  purchasePrice: number
): number {
  if (purchasePrice === 0) return 0;
  return ((sellingPrice - purchasePrice) / purchasePrice) * 100;
}

// Get start of today
export function getStartOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Get start of week
export function getStartOfWeek(): Date {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Get start of month
export function getStartOfMonth(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

// Format a local Date as yyyy-mm-dd for <input type="date" />
export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Parse yyyy-mm-dd as a local Date at 00:00:00.000
export function parseDateInput(value?: string): Date | null {
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function dateInputToStartISO(value?: string): string | undefined {
  const date = parseDateInput(value);
  if (!date) return undefined;
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export function dateInputToEndISO(value?: string): string | undefined {
  const date = parseDateInput(value);
  if (!date) return undefined;
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

export function getDateRangeFromInputs(input: { from?: string; to?: string }): {
  startDate?: string;
  endDate?: string;
} {
  return {
    startDate: dateInputToStartISO(input.from),
    endDate: dateInputToEndISO(input.to),
  };
}

export function getDateRangeLabel(input: { from?: string; to?: string }): string {
  const from = parseDateInput(input.from);
  const to = parseDateInput(input.to);

  if (!from && !to) return "All Time";
  if (from && to && input.from === input.to) return formatDate(from);
  if (from && to) return `${formatDate(from)} 4 ${formatDate(to)}`;
  if (from) return `Since ${formatDate(from)}`;
  return `Up to ${formatDate(to as Date)}`;
}

// Check if stock is low (threshold: 5)
export function isLowStock(stock: number, threshold: number = 5): boolean {
  return stock <= threshold;
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
