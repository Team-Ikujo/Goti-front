import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';

const startMocks = async () => {
  if (true) {
    const { worker } = await import('@/shared/api/mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
    });
  }
};

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  startMocks().then(() => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });
}
