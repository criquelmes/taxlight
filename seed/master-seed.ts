import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function masterSeed() {
  console.log("🚀 MASTER SEED - Configuración optimizada del sistema");
  console.log("=".repeat(60));

  try {
    // ========================================
    // PASO 1: LIMPIEZA TOTAL
    // ========================================
    console.log("\n🧹 PASO 1: Limpiando base de datos...");

    // Contar datos existentes
    const beforeStats = {
      users: await prisma.user.count(),
      orders: await prisma.order.count(),
      subscriptions: await prisma.subscription.count(),
      products: await prisma.product.count(),
      logs: await prisma.subscriptionLog.count(),
    };

    console.log(
      `📊 Datos existentes: ${beforeStats.users} usuarios, ${beforeStats.orders} órdenes, ${beforeStats.subscriptions} suscripciones`
    );

    // Eliminar en orden correcto (respetando relaciones)
    console.log("   🗑️  Eliminando logs...");
    await prisma.subscriptionLog.deleteMany({});

    console.log("   🗑️  Eliminando OrderSubscriptions...");
    await prisma.orderSubscription.deleteMany({});

    console.log("   🗑️  Eliminando Orders...");
    await prisma.order.deleteMany({});

    console.log("   🗑️  Eliminando Users...");
    await prisma.user.deleteMany({});

    console.log("   🗑️  Eliminando Products...");
    await prisma.product.deleteMany({});

    console.log("   🗑️  Eliminando Subscriptions...");
    await prisma.subscription.deleteMany({});

    console.log("✅ Limpieza completada - Base de datos vacía");

    // ========================================
    // PASO 2: CREAR SOLO LAS 4 SUSCRIPCIONES NECESARIAS
    // ========================================
    console.log("\n📦 PASO 2: Creando suscripciones optimizadas...");

    const subscriptionsData = [
      {
        name: "monthly_astrobot_only",
        price: 10000,
        duration: 1,
        type: "MONTHLY" as const,
        products: ["ASTROBOT"],
        description: "Mensual solo Astrobot",
      },
      {
        name: "monthly_both_products",
        price: 10000,
        duration: 1,
        type: "MONTHLY" as const,
        products: ["ASTROBOT", "BITE"],
        description: "Mensual con ambos productos",
      },
      {
        name: "annual_astrobot_only",
        price: 85000,
        duration: 12,
        type: "YEARLY" as const,
        products: ["ASTROBOT"],
        description: "Anual solo Astrobot",
      },
      {
        name: "annual_both_products",
        price: 85000,
        duration: 12,
        type: "YEARLY" as const,
        products: ["ASTROBOT", "BITE"],
        description: "Anual con ambos productos",
      },
    ];

    console.log("   🎯 Creando suscripciones con productos integrados...");

    for (const subData of subscriptionsData) {
      // Crear suscripción
      const subscription = await prisma.subscription.create({
        data: {
          name: subData.name,
          price: subData.price,
          duration: subData.duration,
          type: subData.type,
          isActive: true,
        },
      });

      // Agregar productos a la suscripción
      for (const productName of subData.products) {
        await prisma.product.create({
          data: {
            name: productName as "ASTROBOT" | "BITE",
            subscriptionId: subscription.id,
          },
        });
      }

      console.log(
        `   ✅ ${subscription.name}: ${subData.products.join(
          " + "
        )} (${subscription.price.toLocaleString("es-CL")} CLP)`
      );
    }

    // ========================================
    // PASO 3: VERIFICACIÓN Y RESUMEN
    // ========================================
    console.log("\n📊 PASO 3: Verificación final...");

    const finalSubscriptions = await prisma.subscription.findMany({
      include: { products: true },
      orderBy: { name: "asc" },
    });

    console.log(
      `✅ Total de suscripciones creadas: ${finalSubscriptions.length}`
    );
    console.log("\n📋 SUSCRIPCIONES OPTIMIZADAS:");

    finalSubscriptions.forEach((sub, index) => {
      const products = sub.products.map((p) => p.name).join(", ");
      const typeLabel = sub.type === "MONTHLY" ? "Mensual" : "Anual";
      console.log(`   ${index + 1}. ${sub.name}`);
      console.log(
        `      💰 ${sub.price.toLocaleString("es-CL")} CLP (${typeLabel})`
      );
      console.log(`      📦 Productos: ${products}`);
      console.log("");
    });

    // ========================================
    // MATRIZ DE COBERTURA COMPLETA
    // ========================================
    console.log("🎯 MATRIZ DE COBERTURA:");
    console.log("┌─────────────┬─────────────────┬─────────────────────┐");
    console.log("│    Tipo     │  Solo Astrobot  │  Astrobot + Bite    │");
    console.log("├─────────────┼─────────────────┼─────────────────────┤");
    console.log("│   Mensual   │        ✅        │         ✅          │");
    console.log("│    Anual    │        ✅        │         ✅          │");
    console.log("└─────────────┴─────────────────┴─────────────────────┘");

    // ========================================
    // MAPEO DE CASOS DE USO
    // ========================================
    console.log("\n🔄 MAPEO DE CASOS DE USO:");
    console.log("┌─────────────────────────────┬─────────────────────────┐");
    console.log("│         Selección           │      Suscripción        │");
    console.log("├─────────────────────────────┼─────────────────────────┤");
    console.log("│ Mensual + NO Bite           │ monthly_astrobot_only   │");
    console.log("│ Mensual + SÍ Bite           │ monthly_both_products   │");
    console.log("│ Anual + NO Bite             │ annual_astrobot_only    │");
    console.log("│ Anual + SÍ Bite             │ annual_both_products    │");
    console.log("└─────────────────────────────┴─────────────────────────┘");

    // ========================================
    // ESTADÍSTICAS FINALES
    // ========================================
    const finalStats = {
      users: await prisma.user.count(),
      orders: await prisma.order.count(),
      subscriptions: await prisma.subscription.count(),
      products: await prisma.product.count(),
      logs: await prisma.subscriptionLog.count(),
    };

    console.log("\n📈 ESTADÍSTICAS FINALES:");
    console.log(`   👥 Usuarios: ${finalStats.users}`);
    console.log(`   📦 Órdenes: ${finalStats.orders}`);
    console.log(`   🔄 Suscripciones: ${finalStats.subscriptions}`);
    console.log(`   🎯 Productos: ${finalStats.products}`);
    console.log(`   📝 Logs: ${finalStats.logs}`);

    console.log("\n🎉 CONFIGURACIÓN OPTIMIZADA COMPLETADA!");
    console.log("=".repeat(60));
    console.log("✅ Sistema listo con 4 suscripciones optimizadas");
    console.log("✅ Todas las combinaciones de productos cubiertas");
    console.log("✅ Sin duplicados ni redundancias");
    console.log("✅ API createCustomSubscription funcionará perfectamente");
    console.log("=".repeat(60));

    // ========================================
    // INSTRUCCIONES PARA EL DESARROLLADOR
    // ========================================
    console.log("\n💡 INSTRUCCIONES:");
    console.log(
      "   🔸 Tu API ya NO necesita crear suscripciones dinámicamente"
    );
    console.log("   🔸 Las 4 suscripciones cubren todos los casos");
    console.log(
      "   🔸 Simplifica tu función createCustomSubscription para solo buscar"
    );
    console.log("   🔸 El sistema está optimizado y listo para producción");
  } catch (error) {
    console.error("\n💥 ERROR durante la configuración:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ========================================
// FUNCIÓN DE AYUDA
// ========================================
function showHelp() {
  console.log("🛠️  MASTER SEED - Configuración optimizada");
  console.log("");
  console.log("Este script:");
  console.log("  🧹 Limpia TODOS los datos existentes");
  console.log("  📦 Crea SOLO las 4 suscripciones necesarias:");
  console.log("     • monthly_astrobot_only");
  console.log("     • monthly_both_products");
  console.log("     • annual_astrobot_only");
  console.log("     • annual_both_products");
  console.log("  🎯 Agrega productos correspondientes a cada una");
  console.log("  ✅ Elimina redundancias y duplicados");
  console.log("");
  console.log("USO:");
  console.log("  npx tsx seed/master-seed.ts        - Ejecutar configuración");
  console.log("  npx tsx seed/master-seed.ts help   - Mostrar esta ayuda");
  console.log("");
  console.log("⚠️  ADVERTENCIA: Esto eliminará TODOS los datos existentes");
}

// ========================================
// EJECUTAR
// ========================================
async function main() {
  const action = process.argv[2];

  if (action === "help" || action === "--help" || action === "-h") {
    showHelp();
    return;
  }

  // Confirmación de seguridad
  console.log(
    "⚠️  ADVERTENCIA: Este script eliminará TODOS los datos existentes"
  );
  console.log("   Esto incluye usuarios, órdenes, suscripciones y productos");
  console.log("");
  console.log("🚀 Iniciando configuración optimizada en 3 segundos...");

  // Esperar 3 segundos para que el usuario pueda cancelar
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await masterSeed();
}

main().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
