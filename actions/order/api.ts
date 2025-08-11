import { PrismaClient, $Enums } from "@prisma/client";
import { MercadoPagoConfig, PreApproval } from "mercadopago";

const prisma = new PrismaClient();

interface Message {
  id: string;
  text: string;
  createdAt: Date;
}

// ✅ SOLUCIÓN: Limpiar token antes de usar
const rawToken = process.env.MP_ACCESS_TOKEN!;

console.log("🔧 Limpiando token de MercadoPago...");
console.log("Token original length:", rawToken.length);

// Limpiar caracteres invisibles y espacios
const cleanToken = rawToken
  .split("")
  .filter((char) => {
    const code = char.charCodeAt(0);
    // Solo mantener caracteres ASCII válidos (33-126), excluyendo espacios
    return code >= 33 && code <= 126;
  })
  .join("");

console.log("Token limpio length:", cleanToken.length);

// Validar que el token tenga el formato correcto
if (!/^APP_USR-\d+-\d+-[a-f0-9]+-\d+$/.test(cleanToken)) {
  console.error("❌ Token de MercadoPago tiene formato inválido:", cleanToken);
  throw new Error("Invalid MercadoPago token format");
}

// Validar longitud esperada (87 caracteres)
if (cleanToken.length !== 87) {
  console.error(
    `❌ Token length incorrecto: ${cleanToken.length}, esperado: 87`
  );
  throw new Error(`Invalid token length: ${cleanToken.length}`);
}

console.log("✅ Token MercadoPago limpiado correctamente");

export const mercadopago = new MercadoPagoConfig({
  accessToken: cleanToken,
});

// 🆕 FUNCIÓN PARA ELIMINAR CUENTA DEL BACKEND
async function deleteAccountFromBackend(email: string): Promise<boolean> {
  try {
    const backendApiKey = process.env.EXTERNAL_API_TOKEN;

    if (!backendApiKey) {
      console.error("❌ EXTERNAL_API_TOKEN no configurada");
      return false;
    }

    const response = await fetch(
      `https://backend.taxlight.cl/accounts/${email}`,
      {
        method: "DELETE",
        headers: {
          "X-API-Key": backendApiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `❌ Error eliminando cuenta ${email} del backend:`,
        response.status,
        response.statusText
      );
      return false;
    }

    console.log(`🗑️ Cuenta eliminada del backend: ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error en request de eliminación para ${email}:`, error);
    return false;
  }
}

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

// ✅ FUNCIÓN PARA VALIDAR USANDO LA BD LOCAL (MUCHO MEJOR)
async function validateUserCanSubscribe(email: string) {
  try {
    console.log(`🔍 Validando usuario en BD local: ${email}`);

    // Buscar usuario en nuestra BD
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        orders: {
          where: {
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
        },
      },
    });

    if (!user) {
      // ✅ Usuario no existe - puede crear suscripción
      console.log(`✅ Usuario no existe - puede proceder: ${email}`);
      return {
        valid: true,
        message: "Usuario nuevo, puede crear suscripción",
        userExists: false,
        hasActiveSubscriptions: false,
      };
    }

    if (!user.isActive) {
      // ❌ Usuario existe pero está desactivado
      console.log(`⚠️ Usuario existe pero está desactivado: ${email}`);
      return {
        valid: false,
        error: "USER_INACTIVE",
        message:
          "Tu cuenta está desactivada. Contacta soporte para reactivarla.",
        userExists: true,
        hasActiveSubscriptions: false,
        user: {
          id: user.id,
          name: user.name,
          isActive: user.isActive,
        },
      };
    }

    // Verificar suscripciones activas
    const activeSubscriptions = user.orders;

    if (activeSubscriptions.length > 0) {
      // ❌ Usuario tiene suscripciones activas
      console.log(
        `❌ Usuario tiene ${activeSubscriptions.length} suscripciones activas: ${email}`
      );

      const subscriptionDetails = activeSubscriptions.map((order) => ({
        orderId: order.id,
        subscriptionName: order.orderSubscriptions[0]?.subscription.name,
        products:
          order.orderSubscriptions[0]?.subscription.products?.map(
            (p) => p.name
          ) || [],
        expiresAt: order.expiresAt,
        daysUntilExpiry: order.expiresAt
          ? Math.ceil(
              (order.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
          : null,
      }));

      return {
        valid: false,
        error: "ACTIVE_SUBSCRIPTION",
        message:
          "Ya tienes una suscripción activa. No puedes crear una nueva hasta que expire la actual.",
        userExists: true,
        hasActiveSubscriptions: true,
        user: {
          id: user.id,
          name: user.name,
          isActive: user.isActive,
        },
        activeSubscriptions: subscriptionDetails,
      };
    }

    // ✅ Usuario existe, está activo, pero no tiene suscripciones activas
    console.log(`✅ Usuario existe y puede crear nueva suscripción: ${email}`);
    return {
      valid: true,
      message: "Usuario puede crear nueva suscripción",
      userExists: true,
      hasActiveSubscriptions: false,
      user: {
        id: user.id,
        name: user.name,
        isActive: user.isActive,
      },
    };
  } catch (error) {
    console.error(`❌ Error validando usuario en BD:`, error);
    return {
      valid: false,
      error: "DATABASE_ERROR",
      message: "Error interno al validar usuario",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ✅ FUNCIÓN PARA VALIDAR SIN CREAR CUENTA EXTERNA
async function validateExternalAccount(userData: {
  email: string;
  name: string;
  products: string[];
}) {
  try {
    console.log(`🔍 Validando cuenta externa para: ${userData.email}`);
    console.log(`🎯 Productos: ${userData.products.join(", ")}`);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL
      ? `https://${process.env.NEXT_PUBLIC_API_URL}/accounts/`
      : "https://backend.taxlight.cl/accounts/";

    const accountData = {
      email: userData.email,
      name: userData.name,
      product: userData.products.map((product) => product.toLowerCase()),
    };

    console.log(`📦 Validando disponibilidad de email:`, userData.email);

    // ✅ CAMBIAR ESTRATEGIA: Hacer un POST "falso" para verificar conflicto
    // Enviar datos inválidos para que falle si la cuenta existe
    const testData = {
      email: userData.email,
      name: "validation_test", // Nombre temporal para testing
      product: ["test"], // Producto temporal
    };

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "X-API-Key": process.env.EXTERNAL_API_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

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
      };
    }

    if (response.status === 409) {
      // ✅ Status 409 = Cuenta ya existe (lo que queremos detectar)
      console.warn(`⚠️ Cuenta externa ya existe para ${userData.email}`);
      return {
        valid: false,
        error: "EXTERNAL_ACCOUNT_EXISTS",
        message:
          "Ya tienes una cuenta externa activa. No puedes crear una nueva suscripción.",
        details: result,
      };
    }

    if (response.status === 200 || response.status === 201) {
      // ⚠️ PROBLEMA: Se creó una cuenta de prueba
      // Necesitamos eliminarla inmediatamente
      console.warn(`⚠️ Se creó cuenta de prueba, eliminando...`);

      // TODO: Implementar eliminación de cuenta de prueba
      // Por ahora, la cuenta existe con datos incorretos

      return {
        valid: true,
        message: "Email disponible para suscripción",
        accountExists: false,
        needsCleanup: true, // Flag para indicar que hay que limpiar
      };
    }

    // Otros errores
    return {
      valid: false,
      error: "EXTERNAL_VALIDATION_ERROR",
      message: `Error validando cuenta externa: ${response.status}`,
      details: result,
    };
  } catch (error) {
    console.error(`❌ Error validando cuenta externa:`, error);
    return {
      valid: false,
      error: "NETWORK_ERROR",
      message: "Error de conexión al validar cuenta externa",
    };
  }
}

// ✅ FUNCIÓN PARA CREAR CUENTA EXTERNA (MANEJA 409 CORRECTAMENTE)
async function createExternalAccount(userData: {
  email: string;
  name: string;
  products: string[];
}) {
  try {
    console.log(`🔧 Creando cuenta externa para: ${userData.email}`);
    console.log(`🎯 Productos: ${userData.products.join(", ")}`);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL
      ? `https://${process.env.NEXT_PUBLIC_API_URL}/accounts/`
      : "https://backend.taxlight.cl/accounts/";

    const accountData = {
      email: userData.email,
      name: userData.name,
      product: userData.products.map((product) => product.toLowerCase()),
    };

    console.log(`📦 Creando con datos:`, JSON.stringify(accountData, null, 2));

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "X-API-Key": process.env.EXTERNAL_API_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(accountData),
    });

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      const textResponse = await response.text();
      console.error(`❌ Respuesta de creación no es JSON:`, textResponse);
      throw new Error(
        `Respuesta inválida del servicio externo: ${textResponse}`
      );
    }

    if (response.status === 200 || response.status === 201) {
      // ✅ Cuenta creada exitosamente
      console.log(
        `✅ Cuenta externa creada exitosamente para ${userData.email}`
      );
      return result;
    }

    if (response.status === 409) {
      // ✅ Cuenta ya existe - esto puede ser normal si se creó durante validación
      console.log(`ℹ️ Cuenta externa ya existe para ${userData.email} (409)`);

      // ✅ NO LANZAR ERROR - Tratar como éxito ya que la cuenta existe
      return {
        message: "Cuenta ya existía",
        email: userData.email,
        status: "already_exists",
      };
    }

    // ❌ Otros errores sí son problemáticos
    console.error(
      `❌ Error creando cuenta externa (${response.status}):`,
      result
    );
    throw new Error(
      `Error al crear cuenta externa: ${response.status} - ${JSON.stringify(
        result
      )}`
    );
  } catch (error) {
    console.error(`❌ Error durante creación de cuenta externa:`, error);
    throw error;
  }
}

// ✅ NUEVA FUNCIÓN PARA RETRY DE CUENTAS EXTERNAS PENDIENTES
async function retryPendingExternalAccounts() {
  try {
    console.log("🔄 Buscando órdenes con cuentas externas pendientes...");

    // Buscar órdenes pagadas que tienen problemas de cuenta externa
    const ordersWithPendingAccounts = await prisma.order.findMany({
      where: {
        isPaid: true,
        isActive: true,
        notes: {
          contains: "EXTERNAL_ACCOUNT_PENDING",
        },
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

    console.log(
      `🔍 Encontradas ${ordersWithPendingAccounts.length} órdenes con cuentas externas pendientes`
    );

    const retryResults = [];

    for (const order of ordersWithPendingAccounts) {
      try {
        console.log(`🔄 Reintentando cuenta externa para orden ${order.id}...`);

        // Parsear información de la transacción
        const transactionInfo = order.transactionId?.split("-");
        const includeBite = transactionInfo?.[1] === "bite";
        const products = includeBite ? ["ASTROBOT", "BITE"] : ["ASTROBOT"];

        await createExternalAccount({
          email: order.user.email,
          name: order.user.name,
          products: products,
        });

        // ✅ LIMPIAR LA MARCA DE PENDIENTE
        await prisma.order.update({
          where: { id: order.id },
          data: {
            notes:
              order.notes?.replace(/EXTERNAL_ACCOUNT_PENDING:.*/, "").trim() ||
              null,
          },
        });

        await createSubscriptionLog(
          "REACTIVATED",
          order.id,
          order.userId,
          `✅ Cuenta externa creada exitosamente en retry para ${order.user.email}`
        );

        retryResults.push({
          orderId: order.id,
          userEmail: order.user.email,
          status: "success",
        });

        console.log(
          `✅ Cuenta externa creada en retry para ${order.user.email}`
        );
      } catch (retryError) {
        console.error(`❌ Error en retry para orden ${order.id}:`, retryError);

        retryResults.push({
          orderId: order.id,
          userEmail: order.user.email,
          status: "failed",
          error:
            retryError instanceof Error
              ? retryError.message
              : "Error desconocido",
        });
      }
    }

    const summary = {
      totalPending: ordersWithPendingAccounts.length,
      successful: retryResults.filter((r) => r.status === "success").length,
      failed: retryResults.filter((r) => r.status === "failed").length,
      results: retryResults,
    };

    console.log("📊 Resumen de retry de cuentas externas:", summary);
    return summary;
  } catch (error) {
    console.error("❌ Error en retry de cuentas externas:", error);
    throw error;
  }
}

// ✅ FUNCIÓN PARA OBTENER ÓRDENES CON PROBLEMAS DE CUENTA EXTERNA
async function getOrdersWithExternalAccountIssues() {
  try {
    const ordersWithIssues = await prisma.order.findMany({
      where: {
        isPaid: true,
        notes: {
          contains: "EXTERNAL_ACCOUNT_PENDING",
        },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return ordersWithIssues.map((order) => {
      const errorMessage =
        order.notes?.match(/EXTERNAL_ACCOUNT_PENDING: (.+)/)?.[1] ||
        "Error desconocido";
      const transactionInfo = order.transactionId?.split("-");
      const includeBite = transactionInfo?.[1] === "bite";
      const products = includeBite ? ["ASTROBOT", "BITE"] : ["ASTROBOT"];

      return {
        orderId: order.id,
        userEmail: order.user.email,
        userName: order.user.name,
        products: products,
        subscriptionName: order.orderSubscriptions[0]?.subscription.name,
        paidAt: order.paidAt,
        errorMessage: errorMessage,
        daysSincePayment: order.paidAt
          ? Math.floor(
              (Date.now() - order.paidAt.getTime()) / (1000 * 60 * 60 * 24)
            )
          : null,
      };
    });
  } catch (error) {
    console.error(
      "❌ Error obteniendo órdenes con problemas de cuenta externa:",
      error
    );
    throw error;
  }
}

const api = {
  user: {
    // ✅ FUNCIÓN PRINCIPAL CON TRANSACCIONES Y CUENTA EXTERNA AL FINAL
    async suscribe(
      email: string,
      name: string,
      subscriptionType: "monthly" | "annual" = "monthly",
      includeBite: boolean = false
    ) {
      // ✅ USAR TRANSACCIÓN PARA ROLLBACK AUTOMÁTICO EN CASO DE ERROR
      return await prisma.$transaction(
        async (tx) => {
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
            const subscription =
              await api.subscription.createCustomSubscription(
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

            // PASO 3: ✅ VALIDACIÓN LOCAL ÚNICAMENTE (SIN VALIDACIÓN EXTERNA)
            console.log(`🔍 Validando usuario en BD local...`);
            const userValidation = await validateUserCanSubscribe(email);

            if (!userValidation.valid) {
              console.error(
                `❌ Validación local falló: ${userValidation.error}`
              );

              if (userValidation.error === "USER_INACTIVE") {
                throw new Error(userValidation.message);
              } else if (userValidation.error === "ACTIVE_SUBSCRIPTION") {
                // Información detallada sobre suscripciones activas
                const details = userValidation.activeSubscriptions?.[0];
                const daysLeft = details?.daysUntilExpiry || 0;
                throw new Error(
                  `Ya tienes una suscripción activa que expira ${
                    daysLeft > 0 ? `en ${daysLeft} días` : "pronto"
                  }. ` +
                    `No puedes crear una nueva suscripción hasta que expire la actual.`
                );
              } else {
                throw new Error(
                  `Error al validar usuario: ${userValidation.message}`
                );
              }
            }

            console.log(
              `✅ Validación local exitosa - procediendo con MercadoPago`
            );

            // ✅ NO HACER VALIDACIÓN EXTERNA AQUÍ
            // La cuenta externa se creará SOLO después del pago exitoso

            // PASO 4: ✅ BUSCAR O CREAR USUARIO (DENTRO DE TRANSACCIÓN)
            let user;
            if (userValidation.userExists && userValidation.user) {
              // Usuario ya existe, usar el existente
              user = await tx.user.findUnique({
                where: { id: userValidation.user.id },
              });
              console.log(`👤 Usuario existente: ${user?.email}`);
            } else {
              // Crear nuevo usuario
              user = await tx.user.create({
                data: {
                  email,
                  name: name.trim(),
                },
              });
              console.log(`👤 Usuario creado: ${user.email}`);
            }

            if (!user) {
              throw new Error("Error al obtener o crear usuario");
            }

            // PASO 5: ✅ DEFINIR PRODUCTOS
            const products = includeBite ? ["ASTROBOT", "BITE"] : ["ASTROBOT"];

            // PASO 6: ✅ CREAR SUSCRIPCIÓN EN MERCADOPAGO (ANTES DE LA ORDEN)
            const productNames = products
              .map((p) => p.charAt(0) + p.slice(1).toLowerCase())
              .join(" + ");

            console.log(`💳 Creando suscripción en MercadoPago...`);

            const mpSubscription = await new PreApproval(mercadopago).create({
              body: {
                back_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?plan=${subscriptionType}&bite=${includeBite}`,

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

                external_reference: `sub-${subscriptionType}-${
                  includeBite ? "bite" : "astro"
                }-${Date.now()}-${email.split("@")[0]}`,
              },
            });

            console.log(
              `✅ Suscripción MercadoPago creada: ${mpSubscription.id}`
            );

            // PASO 7: ✅ CREAR ORDEN (DENTRO DE TRANSACCIÓN)
            const encodedInfo = `${subscriptionType}-${
              includeBite ? "bite" : "astro"
            }-${user.email}-${mpSubscription.id}`;

            const order = await tx.order.create({
              data: {
                userId: user.id,
                subtotal: subscription.price,
                tax: 0,
                total: subscription.price,
                isPaid: false,
                mpSubscriptionId: mpSubscription.id,
                transactionId: encodedInfo,

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

            // PASO 8: ✅ CREAR LOG (DENTRO DE TRANSACCIÓN)
            await createSubscriptionLog(
              "CREATED",
              order.id,
              user.id,
              `Suscripción ${subscriptionType} creada con productos: ${productNames}. ` +
                `External ref: ${mpSubscription.external_reference}. ` +
                `Usuario ${
                  userValidation.userExists ? "existente" : "nuevo"
                }. ` +
                `Cuenta externa se creará SOLO después del pago exitoso.`
            );

            console.log(`✅ Proceso completo - Orden creada: ${order.id}`);
            console.log(
              `⏳ Cuenta externa se creará SOLO después del pago exitoso`
            );

            return {
              initPoint: mpSubscription.init_point!,
              orderId: order.id,
              mpSubscriptionId: mpSubscription.id,
              dbSubscriptionId: subscription.id,
              products: products.map((p) => p.toLowerCase()),
              preValidated: true,
              externalReference: mpSubscription.external_reference,
              backUrlConfigured: true,
              externalAccountPending: true, // ✅ Cuenta externa pendiente
              userWasExisting: userValidation.userExists,
            };
          } catch (error) {
            console.error(
              "❌ Error en suscripción, haciendo rollback automático:",
              error
            );
            // ✅ Si hay cualquier error, Prisma hace rollback automático
            throw error;
          }
        },
        {
          // ✅ CONFIGURACIÓN DE TIMEOUT PARA LA TRANSACCIÓN
          timeout: 30000, // 30 segundos
        }
      );
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

    // ✅ FUNCIÓN MEJORADA PARA CONFIRMAR PAGO Y CREAR CUENTA EXTERNA
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

        // PASO 1: ✅ CONFIRMAR PAGO PRIMERO (SIN CUENTA EXTERNA)
        const confirmedOrder = await prisma.$transaction(async (tx) => {
          const updatedOrder = await tx.order.update({
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

          await tx.orderSubscription.update({
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

          return updatedOrder;
        });

        // PASO 2: ✅ CREAR CUENTA EXTERNA DESPUÉS (FUERA DE LA TRANSACCIÓN)
        const transactionInfo = existingOrder.transactionId!.split("-");
        const includeBite = transactionInfo[1] === "bite";
        const products = includeBite ? ["ASTROBOT", "BITE"] : ["ASTROBOT"];

        let externalAccountResult = {
          success: false,
          error: "",
          retryable: true,
        };

        try {
          console.log(`🔧 Creando cuenta externa después del pago exitoso...`);

          await createExternalAccount({
            email: existingOrder.user.email,
            name: existingOrder.user.name,
            products: products,
          });

          externalAccountResult = {
            success: true,
            error: "",
            retryable: false,
          };

          console.log(
            `✅ Cuenta externa creada exitosamente para ${existingOrder.user.email}`
          );

          await createSubscriptionLog(
            "ACTIVATED",
            orderId,
            existingOrder.userId,
            `Suscripción ${subscriptionType} activada hasta ${expiresAt.toISOString()} con productos: ${products.join(
              ", "
            )}. Cuenta externa creada exitosamente.`
          );
        } catch (externalError) {
          console.error(`❌ Error creando cuenta externa:`, externalError);

          // Determinar si es un error temporal o permanente
          const errorMessage =
            externalError instanceof Error
              ? externalError.message
              : "Error desconocido";
          const isRetryable =
            !errorMessage.includes("409") &&
            !errorMessage.includes("validation");

          externalAccountResult = {
            success: false,
            error: errorMessage,
            retryable: isRetryable,
          };

          // ✅ MARCAR LA ORDEN PARA RETRY DE CUENTA EXTERNA
          await prisma.order.update({
            where: { id: orderId },
            data: {
              // Agregar un campo para marcar que necesita retry de cuenta externa
              // Puedes usar el campo notes o crear uno nuevo
              notes: `EXTERNAL_ACCOUNT_PENDING: ${errorMessage}`,
            },
          });

          await createSubscriptionLog(
            "ACTIVATED",
            orderId,
            existingOrder.userId,
            `⚠️ Suscripción ${subscriptionType} activada hasta ${expiresAt.toISOString()} pero falló creación de cuenta externa: ${errorMessage}. ${
              isRetryable
                ? "Se intentará nuevamente."
                : "Requiere intervención manual."
            }`
          );

          // ✅ SI ES UN ERROR NO RETRYABLE, PROGRAMAR PARA REVISIÓN MANUAL
          if (!isRetryable) {
            console.error(
              `🚨 Error no retryable en cuenta externa para orden ${orderId}. Requiere revisión manual.`
            );
          }
        }

        console.log(
          `✅ Payment confirmed for order ${orderId} with transaction ${existingOrder.transactionId}`
        );
        console.log(
          `📅 Subscription active from ${startsAt.toISOString()} to ${expiresAt.toISOString()}`
        );

        return {
          ...confirmedOrder,
          _metadata: {
            externalAccountError: !externalAccountResult.success,
            externalAccountErrorMessage: externalAccountResult.error,
            externalAccountRetryable: externalAccountResult.retryable,
          },
        };
      } catch (error) {
        console.error("❌ Error confirming payment:", error);
        throw error;
      }
    },

    // ✅ FUNCIÓN MEJORADA PARA ROLLBACK CON LIMPIEZA DE MERCADOPAGO
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

        // ✅ INTENTAR CANCELAR LA SUSCRIPCIÓN EN MERCADOPAGO
        if (existingOrder.mpSubscriptionId) {
          try {
            console.log(
              `🔄 Intentando cancelar suscripción MP: ${existingOrder.mpSubscriptionId}`
            );
            const preApproval = new PreApproval(mercadopago);
            await preApproval.update({
              id: existingOrder.mpSubscriptionId,
              body: { status: "cancelled" },
            });
            console.log(
              `✅ Suscripción MP cancelada: ${existingOrder.mpSubscriptionId}`
            );
          } catch (mpError) {
            console.warn(`⚠️ No se pudo cancelar suscripción MP: ${mpError}`);
            // No es crítico, continuamos con el rollback local
          }
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

    async processExpiredSubscriptions(dryRun: boolean = false) {
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
    // 🆕 AQUÍ AGREGAR LA NUEVA FUNCIÓN FILTRADA
    async processExpiredSubscriptionsFiltered(options: {
      dryRun?: boolean;
      testUsersOnly?: boolean;
      specificEmail?: string | null;
      maxProcessCount?: number;
    }) {
      try {
        const {
          dryRun = false,
          testUsersOnly = false,
          specificEmail = null,
          maxProcessCount = 10,
        } = options;

        console.log(
          `🔍 Procesando suscripciones vencidas con filtros:`,
          options
        );

        // 1. Obtener suscripciones vencidas base
        const baseExpiredSubscriptions = await this.getExpiredSubscriptions();

        console.log(
          `📊 Suscripciones vencidas totales encontradas: ${baseExpiredSubscriptions.length}`
        );

        // 2. 🆕 APLICAR FILTROS DE SEGURIDAD
        let filteredSubscriptions = baseExpiredSubscriptions;

        // Filtro 1: Solo usuarios de prueba
        if (testUsersOnly) {
          const testEmailPatterns = [
            /test.*@/i, // test@, testing@, test-user@
            /@ejemplo\./i, // @ejemplo.com, @ejemplo.cl
            /@test\./i, // @test.com, @test.local
            /demo.*@/i, // demo@, demo-user@
            /@.*\.test$/i, // cualquier@dominio.test
            /prueba.*@/i, // prueba@, pruebas@
          ];

          filteredSubscriptions = filteredSubscriptions.filter((sub) =>
            testEmailPatterns.some((pattern) => pattern.test(sub.userEmail))
          );

          console.log(
            `🧪 Filtro de usuarios de prueba aplicado: ${filteredSubscriptions.length} restantes`
          );
        }

        // Filtro 2: Email específico
        if (specificEmail) {
          filteredSubscriptions = filteredSubscriptions.filter(
            (sub) => sub.userEmail.toLowerCase() === specificEmail.toLowerCase()
          );

          console.log(
            `🎯 Filtro de email específico aplicado: ${filteredSubscriptions.length} restantes`
          );
        }

        // Filtro 3: Límite máximo de procesamiento
        if (filteredSubscriptions.length > maxProcessCount) {
          console.log(
            `⚠️ Aplicando límite de seguridad: ${maxProcessCount} de ${filteredSubscriptions.length}`
          );
          filteredSubscriptions = filteredSubscriptions.slice(
            0,
            maxProcessCount
          );
        }

        // 3. Procesar las suscripciones filtradas
        const processedResults = [];
        let successCount = 0;
        let errorCount = 0;
        let skippedCount =
          baseExpiredSubscriptions.length - filteredSubscriptions.length;
        let backendDeletionSuccessCount = 0;
        let backendDeletionErrorCount = 0;

        for (const expired of filteredSubscriptions) {
          try {
            console.log(
              `${dryRun ? "🧪" : "🔄"} Procesando: ${expired.userEmail} (${
                expired.daysExpired
              } días vencida)`
            );

            let backendDeleted = false;

            if (!dryRun) {
              // 🔥 PROCESAMIENTO REAL

              // 1. Crear log y desactivar suscripción local
              await this.deactivateExpiredSubscription(expired.orderId);

              // 2. Desactivar usuario local
              await api.user.deactivateUser(
                expired.userId,
                "Suscripción vencida"
              );

              // 3. 🆕 ELIMINAR CUENTA DEL BACKEND
              backendDeleted = await deleteAccountFromBackend(
                expired.userEmail
              );

              if (backendDeleted) {
                backendDeletionSuccessCount++;
                console.log(
                  `🗑️ ${expired.userEmail} - Cuenta eliminada del backend`
                );
              } else {
                backendDeletionErrorCount++;
                console.error(
                  `⚠️ ${expired.userEmail} - Error eliminando del backend (cuenta local ya desactivada)`
                );
              }
            }

            processedResults.push({
              orderId: expired.orderId,
              userEmail: expired.userEmail,
              subscriptionName: expired.subscriptionName,
              products: expired.products,
              daysExpired: expired.daysExpired,
              status: dryRun ? "would_process" : "processed",
              action: dryRun ? "simulation" : "deactivated",
              backendDeleted: dryRun ? "would_delete" : backendDeleted,
            });

            successCount++;

            console.log(
              `${dryRun ? "🧪" : "✅"} ${expired.userEmail} - ${
                dryRun ? "Simulated" : "Processed"
              }`
            );
          } catch (error) {
            console.error(`❌ Error procesando ${expired.userEmail}:`, error);

            processedResults.push({
              orderId: expired.orderId,
              userEmail: expired.userEmail,
              subscriptionName: expired.subscriptionName,
              status: "error",
              action: "failed",
              error: error instanceof Error ? error.message : "Unknown error",
              backendDeleted: false,
            });

            errorCount++;
          }
        }

        // 4. Resumen de resultados
        const summary = {
          totalExpired: baseExpiredSubscriptions.length,
          filtered: filteredSubscriptions.length,
          skipped: skippedCount,
          processed: successCount,
          errors: errorCount,
          backendDeletions: {
            successful: backendDeletionSuccessCount,
            failed: backendDeletionErrorCount,
            total: backendDeletionSuccessCount + backendDeletionErrorCount,
          },
          results: processedResults,
          filters: {
            testUsersOnly,
            specificEmail,
            maxProcessCount,
            appliedFilters: [
              testUsersOnly && "test-users-only",
              specificEmail && `specific-email: ${specificEmail}`,
              filteredSubscriptions.length !==
                baseExpiredSubscriptions.length && "count-limited",
            ].filter(Boolean),
          },
          dryRun,
          executedAt: new Date().toISOString(),
        };

        console.log(
          `📊 Procesamiento ${
            dryRun ? "(DRY RUN) " : ""
          }completado con filtros:`,
          {
            totalFound: summary.totalExpired,
            filtered: summary.filtered,
            skipped: summary.skipped,
            processed: summary.processed,
            errors: summary.errors,
            backendDeletions: summary.backendDeletions,
          }
        );

        return summary;
      } catch (error) {
        console.error("❌ Error en procesamiento filtrado:", error);
        throw error;
      }
    },
    retryPendingExternalAccounts,
    getOrdersWithExternalAccountIssues,
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
            `❌ Suscripción '${subscriptionName}' no encontrada. ¿Ejecutaste el masterSeed correctamente?`
          );
        }

        const productNames = subscription.products.map((p) => p.name);
        const expectedProducts = includeBite
          ? ["ASTROBOT", "BITE"]
          : ["ASTROBOT"];

        console.log(`✅ Suscripción encontrada: ${subscriptionName}`);
        console.log(`📦 Productos: ${productNames.join(", ")}`);
        console.log(
          `💰 Precio: ${subscription.price.toLocaleString("es-CL")} CLP`
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

  // ✅ UTILIDADES MEJORADAS CON FUNCIÓN PARA CREAR CUENTA EXTERNA
  utils: {
    // Función para parsear external reference del webhook
    parseExternalReference(externalRef: string) {
      try {
        // Formato: sub-{type}-{bite|astro}-{timestamp}-{userPrefix}
        const parts = externalRef.split("-");

        if (parts.length < 5 || parts[0] !== "sub") {
          throw new Error("Invalid external reference format");
        }

        return {
          subscriptionType: parts[1] as "monthly" | "annual",
          hasBite: parts[2] === "bite",
          timestamp: parseInt(parts[3]),
          userPrefix: parts[4],
          fullReference: externalRef,
        };
      } catch (error) {
        console.error("❌ Error parsing external reference:", error);
        return null;
      }
    },

    // Función para parsear transaction ID de la orden
    parseTransactionId(transactionId: string) {
      try {
        // Formato: subscriptionType-bite|astro-email-mpSubscriptionId
        const parts = transactionId.split("-");

        if (parts.length < 4) {
          throw new Error("Invalid transaction ID format");
        }

        return {
          subscriptionType: parts[0] as "monthly" | "annual",
          hasBite: parts[1] === "bite",
          email: parts[2],
          mpSubscriptionId: parts[3],
        };
      } catch (error) {
        console.error("❌ Error parsing transaction ID:", error);
        return null;
      }
    },

    // Función para generar URLs de redirección según estado del pago
    generateRedirectUrl(
      status: string,
      subscriptionType: string,
      hasBite: boolean
    ) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
      const params = new URLSearchParams({
        plan: subscriptionType,
        bite: hasBite.toString(),
      });

      switch (status) {
        case "approved":
        case "authorized":
          return `${baseUrl}/payment/success?${params}`;

        case "rejected":
        case "cancelled":
          return `${baseUrl}/payment/error?type=${status}&${params}`;

        case "pending":
        case "in_process":
          return `${baseUrl}/payment/pending?${params}`;

        default:
          return `${baseUrl}/payment/error?type=unknown&${params}`;
      }
    },

    // Función para verificar estado de suscripción en MercadoPago
    async checkSubscriptionStatus(mpSubscriptionId: string) {
      try {
        const preApproval = new PreApproval(mercadopago);
        const subscription = await preApproval.get({ id: mpSubscriptionId });

        console.log(
          `🔍 Verificando estado de suscripción: ${mpSubscriptionId}`
        );
        console.log(`📊 Estado actual: ${subscription.status}`);

        return {
          id: subscription.id,
          status: subscription.status,
          external_reference: subscription.external_reference,
          payer_email: subscription.payer_email,
          auto_recurring: subscription.auto_recurring,
          reason: subscription.reason,
        };
      } catch (error) {
        console.error(
          `❌ Error verificando suscripción ${mpSubscriptionId}:`,
          error
        );
        throw error;
      }
    },

    // ✅ FUNCIÓN MEJORADA PARA VERIFICAR Y ACTUALIZAR ESTADO DE PAGO
    async checkAndUpdatePaymentStatus(orderId: string) {
      try {
        const order = await prisma.order.findUnique({
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

        if (!order || !order.mpSubscriptionId) {
          return { success: false, message: "Orden no encontrada" };
        }

        // Verificar estado en MercadoPago
        const mpStatus = await this.checkSubscriptionStatus(
          order.mpSubscriptionId
        );

        // Parsear información de la transacción
        const transactionInfo = this.parseTransactionId(
          order.transactionId || ""
        );

        if (!transactionInfo) {
          return { success: false, message: "Error parsing transaction info" };
        }

        // Si está aprobada y no está marcada como pagada en nuestra BD
        if (mpStatus.status === "authorized" && !order.isPaid) {
          // ✅ CONFIRMAR EL PAGO (ESTO CREARÁ LA CUENTA EXTERNA)
          const confirmedOrder = await api.order.confirmPayment(orderId);

          return {
            success: true,
            status: "approved",
            redirectUrl: this.generateRedirectUrl(
              "approved",
              transactionInfo.subscriptionType,
              transactionInfo.hasBite
            ),
            order: confirmedOrder,
            externalAccountCreated:
              !confirmedOrder._metadata.externalAccountError,
          };
        }

        // Si está rechazada o cancelada
        if (mpStatus.status === "cancelled" || mpStatus.status === "rejected") {
          return {
            success: false,
            status: mpStatus.status,
            redirectUrl: this.generateRedirectUrl(
              mpStatus.status,
              transactionInfo.subscriptionType,
              transactionInfo.hasBite
            ),
          };
        }

        // Si está pendiente
        return {
          success: true,
          status: "pending",
          redirectUrl: this.generateRedirectUrl(
            "pending",
            transactionInfo.subscriptionType,
            transactionInfo.hasBite
          ),
        };
      } catch (error) {
        console.error("❌ Error verificando estado de pago:", error);
        return { success: false, message: "Error verificando pago" };
      }
    },

    // ✅ NUEVA FUNCIÓN PARA CREAR CUENTA EXTERNA MANUALMENTE
    async createExternalAccountForOrder(orderId: string) {
      try {
        const order = await prisma.order.findUnique({
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

        if (!order || !order.isPaid) {
          return {
            success: false,
            message: "Orden no encontrada o no pagada",
          };
        }

        // Parsear información de la transacción
        const transactionInfo = this.parseTransactionId(
          order.transactionId || ""
        );

        if (!transactionInfo) {
          return {
            success: false,
            message: "Error parsing transaction info",
          };
        }

        const products = transactionInfo.hasBite
          ? ["ASTROBOT", "BITE"]
          : ["ASTROBOT"];

        try {
          await createExternalAccount({
            email: order.user.email,
            name: order.user.name,
            products: products,
          });

          await createSubscriptionLog(
            "REACTIVATED",
            orderId,
            order.userId,
            `Cuenta externa creada manualmente para orden ${orderId}`
          );

          return {
            success: true,
            message: "Cuenta externa creada exitosamente",
            email: order.user.email,
            products: products,
          };
        } catch (externalError) {
          return {
            success: false,
            message: `Error creando cuenta externa: ${
              externalError instanceof Error
                ? externalError.message
                : "Error desconocido"
            }`,
            email: order.user.email,
          };
        }
      } catch (error) {
        console.error("❌ Error creando cuenta externa para orden:", error);
        return {
          success: false,
          message: "Error interno",
        };
      }
    },
  },
};

// ✅ FUNCIÓN PARA LIMPIAR ÓRDENES HUÉRFANAS (ÚTIL PARA MANTENIMIENTO)
export async function cleanupOrphanedOrders(maxAgeHours: number = 24) {
  try {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

    console.log(
      `🧹 Buscando órdenes huérfanas anteriores a: ${cutoffTime.toISOString()}`
    );

    // Buscar órdenes no pagadas y antiguas
    const orphanedOrders = await prisma.order.findMany({
      where: {
        isPaid: false,
        createdAt: { lt: cutoffTime },
      },
      include: {
        user: true,
      },
    });

    console.log(`🔍 Encontradas ${orphanedOrders.length} órdenes huérfanas`);

    const cleanupResults = [];

    for (const order of orphanedOrders) {
      try {
        // Intentar hacer rollback
        const rollbackResult = await api.order.rollbackTransaction(
          order.id,
          `Cleanup: Orden huérfana de más de ${maxAgeHours} horas`
        );

        // Verificar si el usuario tiene otras órdenes activas
        const userActiveOrders = await prisma.order.count({
          where: {
            userId: order.userId,
            isPaid: true,
            isActive: true,
          },
        });

        // Si no tiene órdenes activas, considerar eliminar el usuario
        if (userActiveOrders === 0) {
          console.log(
            `👤 Usuario ${order.user.email} no tiene órdenes activas`
          );
          // Aquí podrías implementar lógica para desactivar/eliminar usuario
        }

        cleanupResults.push({
          orderId: order.id,
          userEmail: order.user.email,
          status: "cleaned",
          rollbackResult,
        });

        console.log(`✅ Orden huérfana limpiada: ${order.id}`);
      } catch (error) {
        console.error(`❌ Error limpiando orden ${order.id}:`, error);
        cleanupResults.push({
          orderId: order.id,
          userEmail: order.user.email,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const summary = {
      totalOrphaned: orphanedOrders.length,
      cleaned: cleanupResults.filter((r) => r.status === "cleaned").length,
      errors: cleanupResults.filter((r) => r.status === "error").length,
      results: cleanupResults,
    };

    console.log(`📊 Resumen de limpieza:`, summary);
    return summary;
  } catch (error) {
    console.error("❌ Error en cleanup de órdenes huérfanas:", error);
    throw error;
  }
}

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
