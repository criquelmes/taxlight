"use server";

import { revalidatePath } from "next/cache";
import api from "../order/api";

export async function add(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;

    if (!email || !email.trim()) {
      throw new Error("El email es requerido");
    }

    if (!name || !name.trim()) {
      throw new Error("El nombre es requerido");
    }

    console.log("Adding user:", { email: email.trim(), name: name.trim() });

    const user = await api.user.findOrCreate(email.trim(), name.trim());

    console.log("User added/found successfully:", user.id);

    revalidatePath("/");

    return { success: true, userId: user.id };
  } catch (error) {
    console.error("Error al agregar usuario:", error);
    throw error;
  }
}
