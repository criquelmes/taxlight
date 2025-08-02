"use server";

import api from "../order/api";

export async function suscribe(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const subscriptionType = formData.get("subscriptionType") as
      | "monthly"
      | "annual";

    const includeBite = formData.get("includeBite") === "true";
    const selectedProducts = formData.get("selectedProducts") as string;

    if (!email || !name) {
      throw new Error("Email y nombre son requeridos");
    }

    console.log("Subscribing:", {
      email,
      name,
      subscriptionType,
      includeBite,
      selectedProducts,
    });

    // ✅ La función api.user.suscribe() YA maneja las transacciones internamente
    // No necesitas manejar transacciones aquí
    const result = await api.user.suscribe(
      email,
      name,
      subscriptionType || "monthly",
      includeBite
      // ❌ No pasar { transaction } - la función solo acepta 4 parámetros
    );

    console.log("Subscription created:", result);

    return {
      success: true,
      redirectUrl: result.initPoint,
      orderId: result.orderId,
      mpSubscriptionId: result.mpSubscriptionId,
    };
  } catch (error) {
    console.error("Error en suscripción:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
