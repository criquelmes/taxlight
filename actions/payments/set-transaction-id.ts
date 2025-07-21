"use server";

import prisma from "../../lib/prisma";

export const setTransactionId = async (
  orderId: string,
  transactionId: string
) => {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { transactionId },
    });

    if (!order) {
      return {
        ok: false,
        message: `Order id ${orderId} not found or already processed`,
      };
    }

    return {
      ok: true,
      message: "Transaction ID set successfully",
    };
  } catch (error) {
    console.error("Error setting transaction ID:", error);
    return {
      ok: false,
      message: "Error setting transaction ID",
    };
  }
};
