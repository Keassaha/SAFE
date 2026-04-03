/**
 * Connexion credentials sans passer par `signIn()` de next-auth/react,
 * qui enchaîne getProviders + getCsrfToken puis, avec redirect:false, un fetch
 * client vers /api/auth/session — source fréquente de CLIENT_FETCH_ERROR (Electron, réseau).
 */
export type CredentialsSignInResult =
  | { ok: true }
  | { ok: false; error: "network" | "csrf" | "credentials" | "unknown" };

export async function signInWithCredentialsClient(params: {
  cabinetName: string;
  email: string;
  password: string;
  callbackUrl: string;
}): Promise<CredentialsSignInResult> {
  const base = "/api/auth";

  let csrfRes: Response;
  try {
    csrfRes = await fetch(`${base}/csrf`, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  } catch {
    return { ok: false, error: "network" };
  }

  if (!csrfRes.ok) return { ok: false, error: "csrf" };

  let csrfToken: string | undefined;
  try {
    const j = (await csrfRes.json()) as { csrfToken?: string };
    csrfToken = j.csrfToken;
  } catch {
    return { ok: false, error: "csrf" };
  }
  if (!csrfToken) return { ok: false, error: "csrf" };

  const body = new URLSearchParams({
    csrfToken,
    callbackUrl: params.callbackUrl,
    json: "true",
    redirect: "false",
    cabinetName: params.cabinetName.trim(),
    email: params.email.trim().toLowerCase(),
    password: params.password,
  });

  let res: Response;
  try {
    res = await fetch(`${base}/callback/credentials`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    return { ok: false, error: "network" };
  }

  let data: { url?: string; error?: string } = {};
  try {
    data = (await res.json()) as { url?: string; error?: string };
  } catch {
    if (!res.ok) return { ok: false, error: "unknown" };
  }

  if (!res.ok) {
    return { ok: false, error: "credentials" };
  }

  if (data.url) {
    try {
      const u = new URL(data.url, window.location.origin);
      if (u.searchParams.get("error")) {
        return { ok: false, error: "credentials" };
      }
    } catch {
      /* ignore */
    }
  }

  return { ok: true };
}
