// hooks/useSubscriptionManager.ts (versión adaptada)
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

  // ✅ MANTENER TU FUNCIÓN ORIGINAL
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

  // ✅ NUEVA FUNCIÓN: Ejecutar manualmente el cron de Vercel
  const runVercelCron = async (): Promise<ManualCheckResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/cron/subscription-maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ""}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Error en cron de Vercel");
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

  // ✅ FUNCIÓN MEJORADA: Test directo (tu lógica original)
  const runManualCheck = async (): Promise<ManualCheckResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/test-cron", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "direct" }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Error en test manual");
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

  // ✅ NUEVA FUNCIÓN: Test del endpoint de Vercel
  const testVercelEndpoint = async (): Promise<ManualCheckResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/test-cron", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "vercel" }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Error en test de Vercel");
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

  // ✅ FUNCIÓN PARA OBTENER INFO DEL CRON
  const getCronInfo = async () => {
    try {
      const response = await fetch("/api/test-cron", {
        method: "GET",
      });

      const result = await response.json();
      return result.success ? result.info : null;
    } catch (err) {
      console.error("Error obteniendo info del cron:", err);
      return null;
    }
  };

  return {
    loading,
    error,

    // ✅ Funciones existentes
    getStats,
    runManualCheck,

    // ✅ Nuevas funciones para Vercel
    runVercelCron,
    testVercelEndpoint,
    getCronInfo,
  };
}
