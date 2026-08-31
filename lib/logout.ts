/**
 * Sign the current NextAuth user out, then hard-navigate to `to`.
 *
 * We deliberately avoid next-auth/react's `signOut()` here: in this app its
 * redirect:false path did not resolve (the click hung with no navigation), and
 * its redirect:true path resolved the post-signout URL back to the current page
 * instead of the one requested. Both left the user stranded on the page they
 * signed out from.
 *
 * Instead we clear the session the same way Auth.js does under the hood — POST
 * the CSRF token to the signout endpoint (the `X-Auth-Return-Redirect` header
 * makes it return JSON instead of a 302, so there's nothing to follow) — then
 * navigate ourselves. The `catch` ensures we still leave the page even if the
 * request fails, so the user is never stuck.
 */
export async function clientLogout(to = "/"): Promise<void> {
  try {
    const { csrfToken } = await fetch("/api/auth/csrf").then((r) => r.json());
    await fetch("/api/auth/signout", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Auth-Return-Redirect": "1",
      },
      body: new URLSearchParams({ csrfToken, callbackUrl: to }),
    });
  } catch {
    /* fall through — navigate regardless so the user isn't stuck */
  }
  window.location.href = to;
}
