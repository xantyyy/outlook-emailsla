/**
 * hooks/useThread.js
 *
 * Fetches the full conversation thread for a selected email.
 * Uses TanStack Query v5.
 *
 * WHY THE KEY IS ['thread', graphMessageId] AND NOT ['thread', conversationId]
 * ─────────────────────────────────────────────────────────────────────────────
 * Two emails in the same conversation share the same conversationId.
 * Keying by conversationId would cause clicking email B (after email A) to
 * return the stale cached thread from A — the "wrong thread" bug.
 *
 * Keying by graphMessageId guarantees a fresh fetch per selected email.
 *
 * FETCH FLOW
 * ──────────
 *  Step 1: GET /api/outlook/emails/:graphMessageId
 *           → resolves the email's conversationId + full body for the selected message
 *  Step 2: GET /api/outlook/emails/:graphMessageId/thread?conversationId=...
 *           → returns all messages in the thread, sorted oldest→newest
 *           → the selected message is EXCLUDED from this list (rendered separately above)
 *
 * The two requests run sequentially (step 2 depends on step 1's conversationId).
 * Both results are cached: step 1 in ['email', graphMessageId], step 2 in ['thread', graphMessageId].
 *
 * BATCH SUPPORT
 * ─────────────
 * useBatchThreads() fetches up to 20 threads in parallel by sending a single
 * POST /api/email/threads/batch request to the backend. Each thread is cached
 * individually so useThread() can still hit the cache for a thread already
 * loaded by the batch call.
 *
 * OPTIMISATION: queryClient.prefetchQuery is called by MessagingPage on hover
 * so that by the time the user clicks, the thread is already in cache.
 */

import { useQuery, useQueries, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/* ── Internal fetcher: single thread ─────────────────────────────────────── */
async function fetchThread(graphMessageId) {
  // ── Step 1: resolve conversationId (also warms the single-message cache) ──
  const msgRes = await api.get(`/outlook/emails/${graphMessageId}`);
  const email  = msgRes.data?.email;

  if (!email?.conversationId) {
    // Single-message thread — wrap in array so EmailDetail renders it uniformly
    return { selectedEmail: email, thread: [email] };
  }

  // ── Step 2: fetch full thread (mailbox-wide search on backend) ──────────
  const threadRes = await api.get(`/email/messages/${graphMessageId}/thread`, {
    params: { conversationId: email.conversationId },
  });

  // ── Step 3: merge selectedEmail back into thread + sort oldest→newest ────
  //
  // WHY: The inbox list now shows the NEWEST reply as the representative row
  // (after the useFolderMessages sorting fix). Previously the "selectedEmail"
  // was always the thread root (oldest), so EmailDetail could safely render
  // it first. Now it can be any message in the thread, so we must assemble
  // the full list here and let EmailDetail render them in date order.
  //
  // This matches Outlook's behaviour: oldest message at top, newest at bottom.
  const others = threadRes.data?.thread ?? [];

  // Merge — exclude duplicates in case the backend already includes selectedEmail
  const allMsgs = [email, ...others.filter(m => m.id !== email.id)];

  // Sort oldest → newest (Outlook order)
  allMsgs.sort((a, b) => {
    const ta = new Date(a.receivedDateTime ?? a.sentDateTime ?? 0).getTime();
    const tb = new Date(b.receivedDateTime ?? b.sentDateTime ?? 0).getTime();
    return ta - tb;
  });

  return {
    selectedEmail: email,   // original clicked message — used for reply/header context
    thread:        allMsgs, // full thread oldest→newest, INCLUDING selectedEmail
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   useThread — single selected email
══════════════════════════════════════════════════════════════════════════ */

/**
 * @param {string|null} graphMessageId  - The selected email's Graph message ID.
 * @param {boolean}     enabled         - Set false when Outlook is disconnected.
 *
 * Returns:
 *   {
 *     selectedEmail: <full Graph message object with body>,
 *     thread:        <array of Graph message objects, sorted oldest→newest,
 *                     excludes the selected message itself>
 *     isLoading, isFetching, isError, error, refetch
 *   }
 */
export function useThread(graphMessageId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['thread', graphMessageId],
    queryFn:  () => fetchThread(graphMessageId),
    enabled:  !!graphMessageId && enabled,

    staleTime:            2 * 60_000,
    gcTime:               10 * 60_000,
    refetchInterval:      false,
    refetchOnWindowFocus: false,
    placeholderData:      keepPreviousData,
    retry:                1,
    retryDelay:           1_000,
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   useBatchThreads — fetch up to 20 threads in parallel
   
   Pass an array of email objects from the inbox list.
   Each thread is fetched and cached individually under ['thread', msgId].
   Already-cached threads are skipped (staleTime respected).

   Usage:
     const results = useBatchThreads(msgList.slice(0, 20), outlookConnected);
     // results[i] = { data, isLoading, isError } for msgList[i]
══════════════════════════════════════════════════════════════════════════ */

/**
 * @param {Array}   emails   - Array of email objects with { graphId, id } fields.
 *                             Capped at 20 internally.
 * @param {boolean} enabled  - Set false when Outlook is disconnected.
 *
 * Returns an array of TanStack Query result objects (one per email).
 */
export function useBatchThreads(emails = [], enabled = true) {
  const capped = emails.slice(0, 20);

  return useQueries({
    queries: capped.map(email => ({
      queryKey: ['thread', email.graphId ?? email.id],
      queryFn:  () => fetchThread(email.graphId ?? email.id),
      enabled:  !!(email.graphId ?? email.id) && enabled,

      staleTime:            2 * 60_000,
      gcTime:               10 * 60_000,
      refetchInterval:      false,
      refetchOnWindowFocus: false,

      // Don't retry aggressively in batch — avoid hammering the API
      retry:      0,
      retryDelay: 1_000,
    })),
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   usePrefetchThread  — call on email row hover for zero-latency click
══════════════════════════════════════════════════════════════════════════ */

/**
 * Returns a stable prefetch function. Call it onMouseEnter on inbox rows.
 * TanStack Query deduplicates inflight requests, so hammering it is safe.
 *
 * Usage in MessagingPage / MessageInboxPanel:
 *   const prefetchThread = usePrefetchThread(outlookConnected);
 *   <EmailRow onMouseEnter={() => prefetchThread(msg.graphId)} ... />
 */
export function usePrefetchThread(enabled = true) {
  const queryClient = useQueryClient();

  return (graphMessageId) => {
    if (!graphMessageId || !enabled) return;

    queryClient.prefetchQuery({
      queryKey:  ['thread', graphMessageId],
      queryFn:   () => fetchThread(graphMessageId),
      staleTime: 2 * 60_000,
    });
  };
}