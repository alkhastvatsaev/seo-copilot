import * as Sentry from "@sentry/node";

let initialized = false;

function initSentry() {
  if (initialized || !process.env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
  initialized = true;
}

export function captureServerException(error: unknown) {
  initSentry();
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
}
