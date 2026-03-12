export const AUTH_LOGOUT_EVENT = 'auth:logout';

export function emitAuthLogout(reason?: string) {
  window.dispatchEvent(
    new CustomEvent(AUTH_LOGOUT_EVENT, { detail: { reason } }),
  );
}

export function onAuthLogout(handler: (reason?: string) => void) {
  const listener = (evt: Event) => {
    const ce = evt as CustomEvent | undefined;
    handler(ce?.detail?.reason);
  };
  window.addEventListener(AUTH_LOGOUT_EVENT, listener);
  return () => window.removeEventListener(AUTH_LOGOUT_EVENT, listener);
}

