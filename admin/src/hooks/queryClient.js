/**
 * queryClient.js
 *
 * Folder path: src/queryClient.js
 *
 * Import in index.js / main.jsx and wrap your app:
 *
 *   import { QueryClientProvider }  from '@tanstack/react-query';
 *   import { ReactQueryDevtools }    from '@tanstack/react-query-devtools';
 *   import { queryClient }           from './queryClient';
 *
 *   root.render(
 *     <QueryClientProvider client={queryClient}>
 *       <App />
 *       {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
 *     </QueryClientProvider>
 *   );
 *
 * TUNING NOTES
 * ────────────
 * Global defaults are intentionally conservative.
 * Per-query overrides in useFolderMessages and useThread take precedence.
 *
 * staleTime:   30 s global — any query not specifying its own staleTime waits
 *              30 s before a background refetch. Email hooks set 45 s / 2 min.
 *
 * gcTime:      5 min — unused query data stays in memory for 5 min before GC.
 *              Thread hook sets 10 min for warm cache on back-navigation.
 *
 * retry:       2 global. Email hooks override with 1 (threads) or 2 (folders).
 *
 * refetchOnWindowFocus: true — when user returns to the tab, stale data
 *              is refetched. Folder messages benefit from this; threads don't
 *              (they disable it via refetchOnWindowFocus: false in useThread).
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            30_000,
      gcTime:               5 * 60_000,
      retry:                2,
      retryDelay:           attempt => Math.min(1_000 * 2 ** attempt, 8_000),
      refetchOnWindowFocus: true,
      refetchOnReconnect:   true,
    },
    mutations: {
      // Don't retry mutations — sending the same reply twice would be bad
      retry: 0,
    },
  },
});