// Await module evaluation as well as its dependencies. This separate loader lets
// verification exercise real import failures without inventing a browser DOM.
export async function loadApplication(loadApp = () => import('./app.js')) {
  try {
    await loadApp();
    return { status: 'ready' };
  } catch {
    return { status: 'failed' };
  }
}

async function startPage(page) {
  const app = page.querySelector('#app');
  const fallback = app.querySelector('#main');
  const help = page.querySelector('#how-button');
  let fallbackHadFocus = fallback.contains(page.activeElement);
  const trackFocus = event => {
    fallbackHadFocus = fallback.contains(event.target);
  };
  page.addEventListener('focusin', trackFocus);

  const result = await loadApplication(async () => {
    await import('./app.js');
    // An evaluated module must also have produced its initial usable screen.
    if (app.contains(fallback) || !app.querySelector('#main') ||
        !app.querySelector('#start-game')) {
      throw new Error('The launch room did not initialize.');
    }
  });

  page.removeEventListener('focusin', trackFocus);
  if (result.status === 'failed') {
    const activeWasInApp = app.contains(page.activeElement);
    // Initialization may have replaced the fallback before throwing. Keep the
    // original static node so recovery also works without another module load.
    if (!app.contains(fallback)) app.replaceChildren(fallback);
    help.hidden = true;
    fallback.querySelector('#startup-title').textContent = 'The game could not load.';
    fallback.querySelector('#startup-message').textContent = 'Reload to start a new attempt.';
    if ((fallbackHadFocus || activeWasInApp) && page.activeElement === page.body) {
      fallback.focus();
    }
    return;
  }

  help.hidden = false;
  // Normal startup does not move focus. Restore it only when replacement
  // removed a fallback control the player was already using.
  if (fallbackHadFocus && page.activeElement === page.body) {
    app.querySelector('#main').focus();
  }
}

if (typeof document !== 'undefined') void startPage(document);
