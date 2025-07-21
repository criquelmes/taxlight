import { useState } from "react";

interface SubscriptionStats {
  totalActiveSubscriptions: number;
  totalExpiredSubscriptions: number;
  totalRevenue: number;
}

interface ExpiredSubscription {
  orderId: string;
  userId: string;
  userEmail: string;
  userName: string;
  subscriptionName: string;
  subscriptionPrice: number;
  paidAt: Date;
  expirationDate: Date;
  daysExpired: number;
  isActive: boolean;
}

interface ManualCheckResult {
  totalExpired: number;
  processed: number;
  errors: number;
  results: Array<{
    orderId: string;
    userEmail: string;
    status: string;
    daysExpired: number;
  }>;
}

export function useSubscriptionManager() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStats = async (): Promise<{
    stats: SubscriptionStats;
    expiredSubscriptions: ExpiredSubscription[];
    expiredCount: number;
  } | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/cron/init", {
        method: "GET",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const runManualCheck = async (): Promise<ManualCheckResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/cron/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "manual_check" }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getStats,
    runManualCheck,
  };
}
