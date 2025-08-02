import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ✅ Vercel Cron solo usa POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST.",
    });
  }

  // ✅ Verificar que el request viene de Vercel Cron
  const cronAuth = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET) {
    console.error("❌ CRON_SECRET no configurado");
    return res.status(500).json({
      success: false,
      error: "Server configuration error",
    });
  }

  if (cronAuth !== expectedAuth) {
    console.error("❌ Unauthorized cron request");
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  try {
    console.log(
      `🔍 [${new Date().toISOString()}] Iniciando revisión automática de suscripciones (Vercel Cron)...`
    );

    // ✅ USAR TU LÓGICA EXISTENTE
    const api = await import("../../../../actions/order/api");
    const results = await api.default.order.processExpiredSubscriptions();

    console.log("✅ Revisión automática completada:", {
      timestamp: new Date().toISOString(),
      totalExpired: results.totalExpired,
      processed: results.processed,
      errors: results.errors,
    });

    // ✅ TU LOGGING EXISTENTE
    if (results.results.length > 0) {
      console.log("📋 Suscripciones procesadas:");
      results.results.forEach((result, index) => {
        const status = result.status === "processed" ? "✅" : "❌";
        console.log(
          `  ${index + 1}. ${status} ${result.userEmail} (${
            result.subscriptionName
          }) - ${result.daysExpired || 0} días vencida`
        );
      });
    } else {
      console.log("ℹ️ No hay suscripciones vencidas para procesar");
    }

    // ✅ Respuesta exitosa para Vercel
    return res.status(200).json({
      success: true,
      message: "Revisión de suscripciones completada exitosamente",
      data: {
        timestamp: new Date().toISOString(),
        totalExpired: results.totalExpired,
        processed: results.processed,
        errors: results.errors,
        results: results.results,
      },
    });
  } catch (error) {
    console.error("❌ Error en revisión automática de suscripciones:", error);

    return res.status(500).json({
      success: false,
      message: "Error durante la revisión de suscripciones",
      error: error instanceof Error ? error.message : "Error desconocido",
      timestamp: new Date().toISOString(),
    });
  }
}
