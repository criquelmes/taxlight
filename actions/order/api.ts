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

// Función para alcular fecha de vencimiento
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
    console.error("Error creando log:", error);
  }
}

const api = {
  user: {
    async suscribe(
      email: string,
      name: string,
      subscriptionType: "monthly" | "annual" = "monthly",
      includeBite: boolean = false
    ) {
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
            data: {
              email,
              name: name.trim(),
            },
          });
        }

        const subscription = await api.subscription.createCustomSubscription(
          subscriptionType,
          includeBite
        );

        console.log({ subscription });

        if (!subscription) {
          throw new Error("No se pudo encontrar la suscripción");
        }

        const products = includeBite ? ["ASTROBOT", "BITE"] : ["ASTROBOT"];
        const productNames = products
          .map((p) => p.charAt(0) + p.slice(1).toLowerCase())
          .join(" + ");

        // Crear la suscripción en MercadoPago
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

        // Crear la orden pendiente
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

        // Crear log de auditoría
        await createSubscriptionLog(
          "CREATED",
          order.id,
          user.id,
          `Suscripción ${subscriptionType} creada con productos: ${productNames}`
        );

        return {
          initPoint: mpSubscription.init_point!,
          orderId: order.id,
          mpSubscriptionId: mpSubscription.id,
          dbSubscriptionId: subscription.id,
          products: products.map((p) => p.toLowerCase()),
        };
      } catch (error) {
        console.error("Error en suscribe:", error);
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
        console.error("Error en findOrCreate:", error);
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
        console.error("Error en update:", error);
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
        console.error("Error al desactivar usuario:", error);
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

// Función para inicializar suscripciones y productos
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
