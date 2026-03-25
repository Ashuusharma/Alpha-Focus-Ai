"use client";

import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import {
  applyAlphaTransactionToSummary,
  mergeAlphaWalletTransactions,
  toAlphaWalletStreak,
  toAlphaWalletSummary,
} from "@/lib/alphaWallet";
import { useUserStore } from "@/stores/useUserStore";

type WalletSummaryPayload = {
  ok: boolean;
  summary?: Record<string, unknown>;
  transactions?: Array<Record<string, unknown>>;
  streak?: Record<string, unknown> | null;
};

export async function refreshAlphaWallet(userId: string) {
  try {
    const headers = await getSupabaseAuthHeaders();
    if (!headers.Authorization) {
      return false;
    }

    const response = await fetch("/api/alpha-sikka/summary", {
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as WalletSummaryPayload;
    if (!payload.ok) {
      return false;
    }

    useUserStore.getState().setUserData({
      alphaSummary: toAlphaWalletSummary(payload.summary || null) as unknown as Record<string, unknown>,
      alphaTransactions: Array.isArray(payload.transactions) ? payload.transactions : [],
      alphaStreak: toAlphaWalletStreak(payload.streak || null) as unknown as Record<string, unknown>,
    });

    return true;
  } catch {
    return false;
  }
}

export function applyRealtimeAlphaInsert(transaction: Record<string, unknown>) {
  const state = useUserStore.getState();
  const currentTransactions = state.alphaTransactions as Array<Record<string, unknown>>;

  useUserStore.getState().setUserData({
    alphaTransactions: mergeAlphaWalletTransactions(currentTransactions, transaction),
    alphaSummary: applyAlphaTransactionToSummary(
      (state.alphaSummary as Record<string, unknown> | null) || null,
      transaction
    ),
  });
}

export function applyRealtimeAlphaStreak(streak: Record<string, unknown>) {
  useUserStore.getState().setUserData({
    alphaStreak: toAlphaWalletStreak(streak) as unknown as Record<string, unknown>,
  });
}