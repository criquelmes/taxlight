"use client";

import { useSubscriptionManager } from "../../hooks/useSubscriptionManager";
import { useState, useEffect } from "react";

export function VercelCronPanel() {
  const {
    loading,
    error,
    getStats,
    runManualCheck,
    runVercelCron,
    testVercelEndpoint,
    getCronInfo,
  } = useSubscriptionManager();

  const [stats, setStats] = useState<any>(null);
  const [cronInfo, setCronInfo] = useState<any>(null);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    // Cargar info del cron al montar
    getCronInfo().then(setCronInfo);
  }, []);

  const handleGetStats = async () => {
    const result = await getStats();
    setStats(result);
  };

  const handleDirectTest = async () => {
    const result = await runManualCheck();
    setLastResult({ type: "Direct Test", result });
    // Actualizar stats después
    handleGetStats();
  };

  const handleVercelTest = async () => {
    const result = await testVercelEndpoint();
    setLastResult({ type: "Vercel Endpoint Test", result });
    handleGetStats();
  };

  const handleVercelCron = async () => {
    const result = await runVercelCron();
    setLastResult({ type: "Vercel Cron Execution", result });
    handleGetStats();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">🔧 Panel Vercel Cron</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Info del Cron */}
      {cronInfo && (
        <div className="bg-blue-50 p-4 rounded mb-4">
          <h3 className="font-bold mb-2">ℹ️ Información del Cron</h3>
          <div className="text-sm">
            <p>
              <strong>Entorno:</strong> {cronInfo.environment}
            </p>
            <p>
              <strong>Tipo:</strong> {cronInfo.cronType}
            </p>
            <p>
              <strong>Horario:</strong> {cronInfo.schedule}
            </p>
            <p>
              <strong>Endpoint:</strong> {cronInfo.endpoint}
            </p>
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={handleGetStats}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Cargando..." : "📊 Ver Stats"}
        </button>

        <button
          onClick={handleDirectTest}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Ejecutando..." : "🔄 Test Directo"}
        </button>

        <button
          onClick={handleVercelTest}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Probando..." : "🧪 Test Vercel"}
        </button>

        <button
          onClick={handleVercelCron}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Ejecutando..." : "⚡ Ejecutar Cron"}
        </button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="bg-gray-50 p-4 rounded mb-4">
          <h3 className="font-bold mb-2">📊 Estadísticas</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Activas</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.stats.totalActiveSubscriptions}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Vencidas</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.expiredCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ingresos</p>
              <p className="text-2xl font-bold text-blue-600">
                ${stats.stats.totalRevenue.toLocaleString("es-CL")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Último Resultado */}
      {lastResult && (
        <div className="bg-green-50 p-4 rounded">
          <h3 className="font-bold mb-2">
            ✅ Último Resultado: {lastResult.type}
          </h3>
          <div className="text-sm">
            <p>
              <strong>Vencidas:</strong> {lastResult.result?.totalExpired || 0}
            </p>
            <p>
              <strong>Procesadas:</strong> {lastResult.result?.processed || 0}
            </p>
            <p>
              <strong>Errores:</strong> {lastResult.result?.errors || 0}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
