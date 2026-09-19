import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { applyStoredTheme } from './hooks/useTheme.js';
import { registerServiceWorker } from './pwa/register.js';
import { ToastProvider } from './ui/Toast.jsx';

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

// before the first paint, so a dark-mode user never sees a white flash
applyStoredTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

registerServiceWorker();
