import React from 'react';
import ReactDOM from 'react-dom/client';
import { isMswEnabled } from '@/shared/config/runtime';
import App from './App';

const waitForServiceWorkerControl = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  if (navigator.serviceWorker.controller) {
    return;
  }

  await new Promise<void>((resolve) => {
    const timeoutId = window.setTimeout(resolve, 1500);

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        window.clearTimeout(timeoutId);
        resolve();
      },
      { once: true },
    );
  });
};

const startMocks = async () => {
  if (!import.meta.env.DEV || !isMswEnabled) {
    return;
  }

  const { worker } = await import('@/shared/api/mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
  });
  await waitForServiceWorkerControl();
};

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  startMocks()
    .catch((error) => {
      console.error('Failed to start MSW worker:', error);
    })
    .finally(() => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    });
}
