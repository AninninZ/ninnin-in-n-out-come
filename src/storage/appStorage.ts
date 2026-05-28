import { defaultAppData } from "../data/defaultData";
import type { AppData, AppSettings, TransactionPageSize } from "../types";

export const STORAGE_KEY = "ninja-finance-v1";
const transactionPageSizeOptions: TransactionPageSize[] = [5, 10, 20];

export function loadAppData(storage: Storage = window.localStorage): AppData {
  const rawData = storage.getItem(STORAGE_KEY);
  if (!rawData) return defaultAppData;

  try {
    return normalizeAppData(JSON.parse(rawData));
  } catch {
    return defaultAppData;
  }
}

export function saveAppData(
  data: AppData,
  storage: Storage = window.localStorage,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function normalizeAppData(data: unknown): AppData {
  if (!data || typeof data !== "object") return defaultAppData;
  const candidate = data as Partial<AppData>;
  const candidateSettings: Partial<AppSettings> = candidate.settings ?? {};
  const paydayDay =
    typeof candidateSettings.paydayDay === "number"
      ? Math.min(31, Math.max(1, Math.trunc(candidateSettings.paydayDay)))
      : defaultAppData.settings.paydayDay;
  const transactionPageSize = transactionPageSizeOptions.includes(
    candidateSettings.transactionPageSize as TransactionPageSize,
  )
    ? (candidateSettings.transactionPageSize as TransactionPageSize)
    : defaultAppData.settings.transactionPageSize;

  return {
    transactions: Array.isArray(candidate.transactions)
      ? candidate.transactions
      : [],
    categories: Array.isArray(candidate.categories)
      ? candidate.categories
      : defaultAppData.categories,
    settings: {
      ...defaultAppData.settings,
      ...candidateSettings,
      currency: "THB",
      dateLocale: "th-TH",
      paydayDay,
      transactionPageSize,
      schemaVersion: 1,
    },
  };
}
