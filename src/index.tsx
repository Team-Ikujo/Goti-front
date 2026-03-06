import React from 'react';
import ReactDOM from 'react-dom/client';
import { isMswEnabled } from '@/shared/config/runtime';
import App from './App';

const startMocks = async () => {
  if (!isMswEnabled) return;
  const { worker } = await import('@/shared/api/mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
  });
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
