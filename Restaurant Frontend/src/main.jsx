import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store/store';
import App from './App.jsx';
import './index.css';

// ─────────────────────────────────────────────────────────────────────────────
// React Query Client Configuration
// ─────────────────────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,     // 5 minutes — data ko fresh rakho
      gcTime: 1000 * 60 * 10,       // 10 minutes — cache garbage collection
      retry: 1,                      // Failed request pe 1 baar retry
      refetchOnWindowFocus: false,   // Window focus pe auto-refetch band
    },
    mutations: {
      retry: 0, // Mutations pe retry nahi
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Redux Provider — Global State */}
    <Provider store={store}>
      {/* React Query Provider — Server State & Caching */}
      <QueryClientProvider client={queryClient}>
        {/* React Router — Client Side Routing */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
