import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "cras_session";
export const VALID_SESSION_VALUE = "authenticated_marilia";

/**
 * Validador seguro de sessão de usuário para o Edge Runtime.
 * Verifica a presença e integridade do cookie HttpOnly de autenticação.
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);
    return !!session && session.value === VALID_SESSION_VALUE;
  } catch {
    return false;
  }
}
