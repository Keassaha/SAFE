/**
 * Déconnexion sans `signOut()` de next-auth/react (évite getCsrfToken via fetchData → CLIENT_FETCH_ERROR).
 */
export async function signOutClient(callbackUrl = "/"): Promise<void> {
  const base = "/api/auth";
  try {
    const csrfRes = await fetch(`${base}/csrf`, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    if (!csrfRes.ok) {
      window.location.href = callbackUrl;
      return;
    }
    const j = (await csrfRes.json()) as { csrfToken?: string };
    if (!j.csrfToken) {
      window.location.href = callbackUrl;
      return;
    }
    const body = new URLSearchParams({
      csrfToken: j.csrfToken,
      callbackUrl,
      json: "true",
    });
    const res = await fetch(`${base}/signout`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string };
    window.location.href = data.url ?? callbackUrl;
  } catch {
    window.location.href = callbackUrl;
  }
}
