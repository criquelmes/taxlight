import { PrismaClient, $Enums } from "@prisma/client";
import { MercadoPagoConfig, PreApproval } from "mercadopago";

const prisma = new PrismaClient();

interface Message {
  id: string;
  text: string;
  createdAt: Date;
}

export const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

// Función para validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función para formatear suscripciones con productos
function formatSubscriptionWithProducts(subscription: any) {
  return {
    ...subscription,
    products:
      subscription.products?.map((p: any) => p.name.toLowerCase()) || [],
  };
}

// Función para calcular fecha de vencimiento
function calculateExpirationDate(paidAt: Date, subscriptionName: string): Date {
  const date = new Date(paidAt);

  // Detectar tipo basado en el nombre de la suscripción
  if (subscriptionName.includes("monthly")) {
    date.setMonth(date.getMonth() + 1);
  } else if (subscriptionName.includes("annual")) {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    console.warn(
      `⚠️ Tipo de suscripción no reconocido: ${subscriptionName}, usando mensual por defecto`
    );
    date.setMonth(date.getMonth() + 1);
  }

  return date;
}

// Logs de auditoría
async function createSubscriptionLog(
  action:
    | "CREATED"
    | "ACTIVATED"
    | "RENEWED"
    | "EXPIRED"
    | "CANCELLED"
    | "SUSPENDED"
    | "REACTIVATED",
  orderId: string,
  userId: string,
  details?: string
) {
  try {
    await prisma.subscriptionLog.create({
      data: {
        action,
        orderId,
        userId,
        details,
      },
    });
    console.log(`📝 Log creado: ${action} para order ${orderId}`);
  } catch (error) {
    console.error("❌ Error creando log:", error);
  }
}

// FUNCIÓN PARA VALIDAR CUENTA EXTERNA ANTES DEL PAGO
async function validateExternalAccount(userData: {
  email: string;
  name: string;
  products: string[];
}) {
  try {
    console.log(`🔍 Validando cuenta externa para: ${userData.email}`);
    console.log(`🎯 Productos: ${userData.products.join(", ")}`);

    const accountData = {
      email: userData.email,
      name: userData.name,
      product: userData.products.map((product) => product.toLowerCase()),
    };

    console.log(
      `📦 Validando con datos:`,
      JSON.stringify(accountData, null, 2)
    );

    // Intentar crear la cuenta para verificar si ya existe
    const response = await fetch("https://owuii.enkoding.io/accounts", {
      method: "POST",
      headers: {
        accept: "application/json",
        "X-API-Key": process.env.EXTERNAL_API_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(accountData),
    });

    // MEJORA: Manejar respuestas no-JSON
    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      const textResponse = await response.text();
      console.error(`❌ Respuesta de validación no es JSON:`, textResponse);
      return {
        valid: false,
        error: "INVALID_RESPONSE",
        message: "Respuesta inválida del servicio externo",
        details: textResponse,
      };
    }

    if (response.status === 409) {
      // Cuenta ya existe
      console.warn(`⚠️ Cuenta ya existe para ${userData.email}:`, result);
      return {
        valid: false,
        error: "ACCOUNT_EXISTS",
        message:
          "Ya tienes una cuenta activa. No puedes crear una nueva suscripción.",
        details: result,
      };
    }

    if (!response.ok) {
      // Otro tipo de error
      console.error(`❌ Error validando cuenta (${response.status}):`, result);
      return {
        valid: false,
        error: "VALIDATION_ERROR",
        message: `Error al validar la cuenta: ${response.status}`,
        details: result,
      };
    }

    // La cuenta se pudo crear exitosamente
    console.log(
      `✅ Validación exitosa para ${userData.email} - cuenta creada en validación`
    );
    return {
      valid: true,
      message: "Cuenta válida para crear suscripción",
      accountAlreadyCreated: true, // Flag importante
      details: result,
    };
  } catch (error) {
    console.error(`❌ Error durante validación:`, error);
    return {
      valid: false,
      error: "NETWORK_ERROR",
      message: "Error de conexión al validar la cuenta",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

const api = {
  user: {
    // FUNCIÓN PRINCIPAL DE SUSCRIPCIÓN CON VALIDACIÓN PREVIA
    async suscribe(
      email: string,
      name: string,
      subscriptionType: "monthly" | "annual" = "monthly",
      includeBite: boolean = false
    ) {
      try {
        // PASO 1: Validaciones básicas
        if (!isValidEmail(email)) {
          throw new Error("Email inválido");
        }

        if (!name.trim()) {
          throw new Error("Nombre es requerido");
        }

        console.log(
          `🚀 Iniciando suscripción para ${email}: ${subscriptionType} ${
            includeBite ? "con Bite" : "solo Astrobot"
          }`
        );

        // PASO 2: Buscar suscripción correspondiente
        const subscription = await api.subscription.createCustomSubscription(
          subscriptionType,
          includeBite
        );

        if (!subscription) {
          throw new Error("No se pudo encontrar la suscripción");
        }

        console.log(`✅ Suscripción encontrada:`, {
          name: subscription.name,
          price: subscription.price,
          products: subscription.products.map((p) => p.name),
        });

        // PASO 3: VALIDACIÓN PREVIA - Verificar cuenta externa ANTES del pago
        const products = includeBite ? ["ASTROBOT", "BITE"] : ["ASTROBOT"];

        console.log(`🔍 Validando cuenta externa antes del pago...`);
        const validation = await validateExternalAccount({
          email: email,
          name: name.trim(),
          products: products,
        });

        if (!validation.valid) {
          // La validación falló - no crear suscripción en MercadoPago
          console.error(`❌ Validación falló: ${validation.error}`);

          // Lanzar error específico según el tipo
          if (validation.error === "ACCOUNT_EXISTS") {
            throw new Error(
              "Ya tienes una cuenta activa. No puedes crear una nueva suscripción."
            );
          } else if (validation.error === "NETWORK_ERROR") {
            throw new Error(
              "Error de conexión. Por favor, inténtalo de nuevo."
            );
          } else {
            throw new Error(
              `Error al validar la cuenta: ${validation.message}`
            );
          }
        }

        console.log(`✅ Validación exitosa - procediendo con MercadoPago`);

        // PASO 4: Buscar o crear el usuario en nuestra BD
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: name.trim(),
            },
          });
          console.log(`👤 Usuario creado: ${user.email}`);
        } else {
          console.log(`👤 Usuario existente: ${user.email}`);
        }

        // PASO 5: Crear la suscripción en MercadoPago (solo si validación pasó)
        const productNames = products
          .map((p) => p.charAt(0) + p.slice(1).toLowerCase())
          .join(" + ");

        console.log(`💳 Creando suscripción en MercadoPago...`);

        const mpSubscription = await new PreApproval(mercadopago).create({
          body: {
            back_url: process.env.APP_URL!,
            reason: `Suscripción ${
              subscriptionType === "annual" ? "Anual" : "Mensual"
            } de ${productNames}`,
            auto_recurring: {
              frequency: subscriptionType === "monthly" ? 1 : 12,
              frequency_type: "months",
              transaction_amount: subscription.price,
              currency_id: "CLP",
            },
            payer_email: email,
            status: "pending",
          },
        });

        console.log(`✅ Suscripción MercadoPago creada: ${mpSubscription.id}`);

        // PASO 6: Crear la orden pendiente con flag de validación
        const order = await prisma.order.create({
          data: {
            userId: user.id,
            subtotal: subscription.price,
            tax: 0,
            total: subscription.price,
            isPaid: false,
            mpSubscriptionId: mpSubscription.id,
            orderSubscriptions: {
              create: {
                subscriptionId: subscription.id,
                price: subscription.price,
                quantity: 1,
              },
            },
          },
          include: {
            orderSubscriptions: {
              include: {
                subscription: {
                  include: { products: true },
                },
              },
            },
          },
        });

        // PASO 7: Log con nota de validación previa
        await createSubscriptionLog(
          "CREATED",
          order.id,
          user.id,
          `Suscripción ${subscriptionType} creada con productos: ${productNames} (cuenta externa pre-validada y creada)`
        );

        console.log(`✅ Proceso completo - Orden creada: ${order.id}`);

        return {
          initPoint: mpSubscription.init_point!,
          orderId: order.id,
          mpSubscriptionId: mpSubscription.id,
          dbSubscriptionId: subscription.id,
          products: products.map((p) => p.toLowerCase()),
          preValidated: true, // Flag para indicar que ya se validó y creó la cuenta
        };
      } catch (error) {
        console.error("❌ Error en suscribe:", error);
        throw error;
      }
    },

    async findByEmail(email: string) {
      if (!isValidEmail(email)) {
        return null;
      }

      return await prisma.user.findUnique({
        where: { email },
        include: {
          orders: {
            include: {
              orderSubscriptions: {
                include: {
                  subscription: {
                    include: { products: true },
                  },
                },
              },
            },
          },
        },
      });
    },

    async findOrCreate(email: string, name: string) {
      try {
        if (!isValidEmail(email)) {
          throw new Error("Email inválido");
        }

        if (!name.trim()) {
          throw new Error("Nombre es requerido");
        }

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: { email, name: name.trim() },
          });
        }

        return user;
      } catch (error) {
        console.error("❌ Error en findOrCreate:", error);
        throw error;
      }
    },

    async update(userId: string, data: { name?: string; isActive?: boolean }) {
      try {
        const updateData: any = {};

        if (data.name !== undefined) {
          if (!data.name.trim()) {
            throw new Error("Nombre no puede estar vacío");
          }
          updateData.name = data.name.trim();
        }

        if (data.isActive !== undefined) {
          updateData.isActive = data.isActive;
        }

        return await prisma.user.update({
          where: { id: userId },
          data: updateData,
        });
      } catch (error) {
        console.error("❌ Error en update:", error);
        throw error;
      }
    },

    async getActiveSubscriptions(userId: string) {
      return await prisma.order.findMany({
        where: {
          userId,
          isPaid: true,
          isActive: true,
        },
        include: {
          orderSubscriptions: {
            include: {
              subscription: {
                include: { products: true },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },

    async deactivateUser(
      userId: string,
      reason: string = "Suscripción vencida"
    ) {
      try {
        const user = await prisma.user.update({
          where: { id: userId },
          data: { isActive: false },
        });

        console.log(`👤 Usuario ${userId} desactivado: ${reason}`);
        return user;
      } catch (error) {
        console.error("❌ Error al desactivar usuario:", error);
        throw error;
      }
    },
  },

  order: {
    async setTransactionId(orderId: string, transactionId: string) {
      try {
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
        });

        if (!existingOrder) {
          return {
            ok: false,
            message: `Order id ${orderId} not found`,
          };
        }

        if (existingOrder.isPaid) {
          return {
            ok: false,
            message: `Order id ${orderId} is already paid`,
          };
        }

        const order = await prisma.order.update({
          where: { id: orderId },
          data: { transactionId },
        });

        console.log(
          `✅ Transaction ID ${transactionId} set for order ${orderId}`
        );

        return {
          ok: true,
          message: "Transaction ID set successfully",
          order,
        };
      } catch (error) {
        console.error("❌ Error setting transaction ID:", error);
        return {
          ok: false,
          message: "Error setting transaction ID",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    async confirmPayment(orderId: string) {
      try {
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            user: true,
            orderSubscriptions: {
              include: {
                subscription: {
                  include: { products: true },
                },
              },
            },
          },
        });

        if (!existingOrder) {
          throw new Error(`Order id ${orderId} not found`);
        }

        if (existingOrder.isPaid) {
          throw new Error(`Order id ${orderId} is already paid`);
        }

        if (!existingOrder.transactionId) {
          throw new Error(`Order id ${orderId} has no transaction ID set`);
        }

        const subscriptionType =
          existingOrder.orderSubscriptions[0]?.subscription.name;
        const paidAt = new Date();
        const startsAt = paidAt;
        const expiresAt = calculateExpirationDate(paidAt, subscriptionType);

        const confirmedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            isPaid: true,
            paidAt,
            startsAt,
            expiresAt,
            isActive: true,
            lastCheckedAt: paidAt,
          },
          include: {
            user: true,
            orderSubscriptions: {
              include: {
                subscription: {
                  include: { products: true },
                },
              },
            },
          },
        });

        await prisma.orderSubscription.update({
          where: {
            orderId_subscriptionId: {
              orderId: orderId,
              subscriptionId:
                existingOrder.orderSubscriptions[0].subscriptionId,
            },
          },
          data: {
            startDate: startsAt,
            endDate: expiresAt,
            isActive: true,
          },
        });

        const products =
          existingOrder.orderSubscriptions[0]?.subscription.products?.map(
            (p) => p.name
          ) || [];
        await createSubscriptionLog(
          "ACTIVATED",
          orderId,
          existingOrder.userId,
          `Suscripción ${subscriptionType} activada hasta ${expiresAt.toISOString()} con productos: ${products.join(
            ", "
          )}`
        );

        console.log(
          `✅ Payment confirmed for order ${orderId} with transaction ${existingOrder.transactionId}`
        );
        console.log(
          `📅 Subscription active from ${startsAt.toISOString()} to ${expiresAt.toISOString()}`
        );

        return confirmedOrder;
      } catch (error) {
        console.error("❌ Error confirming payment:", error);
        throw error;
      }
    },

    async rollbackTransaction(orderId: string, reason?: string) {
      try {
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            user: true,
            orderSubscriptions: {
              include: {
                subscription: {
                  include: { products: true },
                },
              },
            },
          },
        });

        if (!existingOrder) {
          return {
            ok: false,
            message: `Order id ${orderId} not found`,
          };
        }

        if (existingOrder.isPaid) {
          return {
            ok: false,
            message: `Cannot rollback paid order ${orderId}`,
          };
        }

        const rolledBackOrder = await prisma.order.update({
          where: { id: orderId },
          data: { transactionId: null },
        });

        await createSubscriptionLog(
          "CANCELLED",
          orderId,
          existingOrder.userId,
          `Transacción cancelada: ${reason || "Not specified"}`
        );

        console.log(
          `🔄 Transaction rolled back for order ${orderId}. Reason: ${
            reason || "Not specified"
          }`
        );

        return {
          ok: true,
          message: "Transaction rolled back successfully",
          order: rolledBackOrder,
        };
      } catch (error) {
        console.error("❌ Error rolling back transaction:", error);
        return {
          ok: false,
          message: "Error rolling back transaction",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    async getPendingTransactions() {
      try {
        return await prisma.order.findMany({
          where: {
            transactionId: { not: null },
            isPaid: false,
          },
          include: {
            user: true,
            orderSubscriptions: {
              include: {
                subscription: {
                  include: { products: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
      } catch (error) {
        console.error("❌ Error getting pending transactions:", error);
        throw error;
      }
    },

    async cleanupStaleTransactions(maxAgeMinutes: number = 30) {
      try {
        const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

        const staleOrders = await prisma.order.findMany({
          where: {
            transactionId: { not: null },
            isPaid: false,
            createdAt: { lt: cutoffTime },
          },
        });

        const cleanupResults = [];

        for (const order of staleOrders) {
          const result = await this.rollbackTransaction(
            order.id,
            `Stale transaction cleanup after ${maxAgeMinutes} minutes`
          );
          cleanupResults.push({ orderId: order.id, result });
        }

        console.log(
          `🧹 Cleaned up ${cleanupResults.length} stale transactions`
        );

        return {
          ok: true,
          cleanedCount: cleanupResults.length,
          results: cleanupResults,
        };
      } catch (error) {
        console.error("❌ Error cleaning up stale transactions:", error);
        return {
          ok: false,
          message: "Error cleaning up stale transactions",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    async findById(orderId: string) {
      return await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          orderSubscriptions: {
            include: {
              subscription: {
                include: { products: true },
              },
            },
          },
        },
      });
    },

    async getUserOrders(userId: string) {
      return await prisma.order.findMany({
        where: { userId },
        include: {
          orderSubscriptions: {
            include: {
              subscription: {
                include: { products: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    },

    async getExpiredSubscriptions() {
      try {
        const now = new Date();

        const expiredOrders = await prisma.order.findMany({
          where: {
            isPaid: true,
            isActive: true,
            expiresAt: { lt: now },
          },
          include: {
            user: true,
            orderSubscriptions: {
              include: {
                subscription: {
                  include: { products: true },
                },
              },
            },
          },
        });

        const expiredSubscriptions = expiredOrders.map((order) => {
          const daysExpired = Math.floor(
            (now.getTime() - order.expiresAt!.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            orderId: order.id,
            userId: order.userId,
            userEmail: order.user.email,
            userName: order.user.name,
            subscriptionName: order.orderSubscriptions[0]?.subscription.name,
            subscriptionPrice: order.orderSubscriptions[0]?.price,
            products:
              order.orderSubscriptions[0]?.subscription.products?.map((p) =>
                p.name.toLowerCase()
              ) || [],
            paidAt: order.paidAt,
            startsAt: order.startsAt,
            expirationDate: order.expiresAt,
            daysExpired,
            isActive: order.isActive,
          };
        });

        return expiredSubscriptions;
      } catch (error) {
        console.error("❌ Error getting expired subscriptions:", error);
        throw error;
      }
    },

    async deactivateExpiredSubscription(orderId: string) {
      try {
        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            isActive: false,
            lastCheckedAt: new Date(),
          },
          include: {
            user: true,
            orderSubscriptions: {
              include: {
                subscription: {
                  include: { products: true },
                },
              },
            },
          },
        });

        await prisma.orderSubscription.updateMany({
          where: { orderId },
          data: { isActive: false },
        });

        await createSubscriptionLog(
          "EXPIRED",
          orderId,
          order.userId,
          `Suscripción vencida y desactivada`
        );

        console.log(`🔴 Suscripción desactivada: ${orderId}`);
        return order;
      } catch (error) {
        console.error("❌ Error deactivating subscription:", error);
        throw error;
      }
    },

    async processExpiredSubscriptions() {
      try {
        const expiredSubscriptions = await this.getExpiredSubscriptions();
        const processedResults = [];

        console.log(
          `🔍 Encontradas ${expiredSubscriptions.length} suscripciones vencidas`
        );

        for (const expired of expiredSubscriptions) {
          try {
            await this.deactivateExpiredSubscription(expired.orderId);
            await api.user.deactivateUser(
              expired.userId,
              "Suscripción vencida"
            );

            processedResults.push({
              orderId: expired.orderId,
              userEmail: expired.userEmail,
              subscriptionName: expired.subscriptionName,
              products: expired.products,
              status: "processed",
              daysExpired: expired.daysExpired,
            });

            console.log(
              `✅ Procesada suscripción vencida: ${expired.userEmail} (${expired.daysExpired} días)`
            );
          } catch (error) {
            console.error(
              `❌ Error procesando suscripción ${expired.orderId}:`,
              error
            );
            processedResults.push({
              orderId: expired.orderId,
              userEmail: expired.userEmail,
              subscriptionName: expired.subscriptionName,
              status: "error",
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        const summary = {
          totalExpired: expiredSubscriptions.length,
          processed: processedResults.filter((r) => r.status === "processed")
            .length,
          errors: processedResults.filter((r) => r.status === "error").length,
          results: processedResults,
        };

        console.log(`📊 Resumen del procesamiento:`, summary);
        return summary;
      } catch (error) {
        console.error("❌ Error processing expired subscriptions:", error);
        throw error;
      }
    },
  },

  subscription: {
    async getAll() {
      const subscriptions = await prisma.subscription.findMany({
        where: { isActive: true },
        include: { products: true },
        orderBy: { price: "asc" },
      });

      return subscriptions.map(formatSubscriptionWithProducts);
    },

    async findByName(name: string) {
      const subscription = await prisma.subscription.findUnique({
        where: { name },
        include: { products: true },
      });

      return subscription ? formatSubscriptionWithProducts(subscription) : null;
    },

    async findById(id: string) {
      const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: { products: true },
      });

      return subscription ? formatSubscriptionWithProducts(subscription) : null;
    },

    // FUNCIÓN SIMPLIFICADA - SOLO BUSCA LA SUSCRIPCIÓN EXISTENTE
    async createCustomSubscription(
      subscriptionType: "monthly" | "annual",
      includeBite: boolean
    ) {
      try {
        const subscriptionName = includeBite
          ? `${subscriptionType}_both_products`
          : `${subscriptionType}_astrobot_only`;

        console.log(`🔍 Buscando suscripción: ${subscriptionName}`);

        const subscription = await prisma.subscription.findUnique({
          where: { name: subscriptionName },
          include: { products: true },
        });

        if (!subscription) {
          throw new Error(
            `❌ Suscripción '${subscriptionName}' no encontrada. ` +
              `¿Ejecutaste el masterSeed correctamente?`
          );
        }

        const productNames = subscription.products.map((p) => p.name);
        const expectedProducts = includeBite
          ? ["ASTROBOT", "BITE"]
          : ["ASTROBOT"];

        console.log(`✅ Suscripción encontrada: ${subscriptionName}`);
        console.log(`📦 Productos: ${productNames.join(", ")}`);
        console.log(
          `💰 Precio: $${subscription.price.toLocaleString("es-CL")} CLP`
        );

        // MEJORA: Verificación más robusta de productos
        const hasCorrectProducts = expectedProducts.every((product) =>
          productNames.includes(product as $Enums.ProductType)
        );

        if (!hasCorrectProducts) {
          console.warn(
            `⚠️ La suscripción ${subscriptionName} no tiene los productos esperados. ` +
              `Esperados: ${expectedProducts.join(
                ", "
              )}, Encontrados: ${productNames.join(", ")}`
          );
        }

        return subscription;
      } catch (error) {
        console.error("❌ Error buscando suscripción personalizada:", error);
        throw error;
      }
    },

    async getStats() {
      try {
        const totalActiveSubscriptions = await prisma.order.count({
          where: {
            isPaid: true,
            isActive: true,
          },
        });

        const totalExpiredSubscriptions = await prisma.order.count({
          where: {
            isPaid: true,
            isActive: false,
            expiresAt: { lt: new Date() },
          },
        });

        const totalRevenue = await prisma.order.aggregate({
          where: { isPaid: true },
          _sum: { total: true },
        });

        return {
          totalActiveSubscriptions,
          totalExpiredSubscriptions,
          totalRevenue: totalRevenue._sum.total || 0,
        };
      } catch (error) {
        console.error("❌ Error getting subscription stats:", error);
        throw error;
      }
    },
  },

  message: {
    async add(message: string, userId?: string) {
      console.log(
        `[${new Date().toISOString()}] ${
          userId ? `User ${userId}: ` : ""
        }${message}`
      );
    },

    async list(): Promise<Message[]> {
      return [];
    },
  },
};

// Función para inicializar suscripciones y productos (mantener para retrocompatibilidad)
export async function initializeSubscriptionsAndProducts() {
  try {
    const subscriptions = [
      {
        name: "monthly",
        price: 10000,
        duration: 1,
        type: "MONTHLY" as const,
      },
      {
        name: "annual",
        price: 85000,
        duration: 12,
        type: "YEARLY" as const,
      },
    ];

    const createdSubscriptions = [];
    for (const sub of subscriptions) {
      const subscription = await prisma.subscription.upsert({
        where: { name: sub.name },
        update: {
          price: sub.price,
          duration: sub.duration,
          type: sub.type,
        },
        create: sub,
      });
      createdSubscriptions.push(subscription);
    }

    const productTypes: $Enums.ProductType[] = ["ASTROBOT", "BITE"];

    for (const subscription of createdSubscriptions) {
      for (const productType of productTypes) {
        await prisma.product.upsert({
          where: {
            name_subscriptionId: {
              name: productType,
              subscriptionId: subscription.id,
            },
          },
          update: {
            name: productType,
            subscriptionId: subscription.id,
          },
          create: {
            name: productType,
            subscriptionId: subscription.id,
          },
        });
      }
    }

    console.log("✅ Suscripciones y productos inicializados correctamente");

    const subscriptionsWithProducts = await prisma.subscription.findMany({
      include: { products: true },
    });

    console.log(
      "📦 Suscripciones creadas:",
      JSON.stringify(subscriptionsWithProducts, null, 2)
    );
  } catch (error) {
    console.error("❌ Error al inicializar suscripciones y productos:", error);
    throw error;
  }
}

export default api;
