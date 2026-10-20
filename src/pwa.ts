// Updates wait until all game tabs close, so an active scene is never reloaded.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch((error: unknown) => {
        // A failed install must not prevent ordinary online play.
        console.warn('Offline play is unavailable for this visit.', error);
      });
  });
}
