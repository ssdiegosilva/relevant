import * as Sentry from '@sentry/react-native';

import { env } from './env';

export function initSentry() {
  if (!env.sentryDsn) return;
  Sentry.init({
    dsn: env.sentryDsn,
    debug: __DEV__,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  });
}

export { Sentry };
