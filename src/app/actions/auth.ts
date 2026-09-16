"use server";

import { signIn, signOut } from "@/auth";
import { fail } from "@/lib/forms";
import { demoLoginEnabled, googleOAuthEnabled } from "@/lib/auth-mode";
import { AuthError } from "next-auth";

export async function demoSignIn(formData: FormData) {
  if (!demoLoginEnabled()) {
    fail("/entrar", "Acesso de demonstração desligado neste ambiente. Use o Google cadastrado no Darpe.");
  }
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) fail("/entrar", "Informe o e-mail cadastrado.");

  try {
    await signIn("credentials", { email, redirectTo: "/app" });
  } catch (error) {
    if (error instanceof AuthError) {
      fail("/entrar", "Acesso negado. Use um e-mail já cadastrado no Darpe.");
    }
    throw error;
  }
}

export async function googleSignIn() {
  if (!googleOAuthEnabled()) {
    fail("/entrar", "Google OAuth ainda não está configurado neste ambiente.");
  }
  try {
    await signIn("google", { redirectTo: "/app" });
  } catch (error) {
    if (error instanceof AuthError) {
      fail("/entrar", "Não foi possível entrar com Google.");
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/entrar" });
}
