/**
 * hooks/useTickets.js  (FRONTEND — place in src/hooks/)
 *
 * TanStack Query v5 hooks for ticket data with:
 *  • Optimistic status updates (feels instant — 0ms perceived delay)
 *  • Socket.io subscription for server-confirmed updates
 *  • SLA deadline tracking per ticket
 *
 * HOOKS EXPORTED
 * ──────────────
 *  useTicket(conversationId)          — single ticket data + SLA state
 *  useTicketList(filters)             — paginated ticket list
 *  useUpdateTicketStatus()            — mutation with optimistic update
 *  useTicketSocketSync(conversationId) — subscribes to socket events for one ticket
 *
 * OPTIMISTIC UPDATE FLOW
 * ───────────────────────
 *  1. User clicks "Reply" → mutation fires.
 *  2. onMutate: immediately update the cache (status = 'pending', UI changes NOW).
 *  3. Backend processes the reply → sends 200 OK.
 *  4. Socket event `ticket:statusUpdated` arrives → confirms / corrects the cache.
 *  5. If mutation errors → onError rolls back to the snapshot saved in onMutate.
 *
 * SOCKET CONFIRMATION FLOW
 * ────────────────────────
 *  The webhook handler on the backend emits ticket:statusUpdated via Socket.io
 *  whenever a Graph notification triggers a status change. The frontend listens
 *  and calls queryClient.setQueryData to apply the confirmed state — no refetch needed.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback }       from 'react';
import api                                        from '../services/api';
import { socket }                                 from '../services/socketClient';

const pendingStatusLocks = new Set();

export function lockPendingTicketStatus(conversationId) {
  if (!conversationId) return;
  pendingStatusLocks.add(conversationId);
}

export function unlockPendingTicketStatus(conversationId) {
  if (!conversationId) return;
  pendingStatusLocks.delete(conversationId);
}

export function isPendingTicketLocked(conversationId) {
  return conversationId ? pendingStatusLocks.has(conversationId) : false;
}

/* ═══════════════════════════════════════════════════════════════════════════
   useTicket — fetch a single ticket by conversationId
═══════════════════════════════════════════════════════════════════════════ */

/**
 * @param {string|null} conversationId
 *
 * Returns the ticket document plus a derived `slaRemainingMs` that counts down in real-time.
 * (The actual countdown ticker is in useSlaTimer — keep this hook data-only.)
 */
export function useTicket(conversationId) {
  return useQuery({
    queryKey: ['ticket', conversationId],
    queryFn:  async () => {
      const res = await api.get(`/tickets/by-conversation/${conversationId}`);
      return res.data.ticket;
    },
    enabled:              !!conversationId,
    staleTime:            30_000,
    gcTime:               5 * 60_000,
    refetchOnWindowFocus: false,
    retry:                1,
    select: (ticket) => {
      if (!ticket || !isPendingTicketLocked(conversationId)) return ticket;
      return {
        ...ticket,
        status: 'pending',
      };
    },
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   useTicketList — paginated ticket list with optional status filter
═══════════════════════════════════════════════════════════════════════════ */

/**
 * @param {{ status?: string, page?: number, limit?: number }} filters
 */
export function useTicketList(filters = {}) {
  const { status, page = 1, limit = 50 } = filters;

  return useQuery({
    queryKey: ['tickets', { status, page, limit }],
    queryFn:  async () => {
      const params = new URLSearchParams({ page, limit });
      if (status) params.set('status', status);
      const res = await api.get(`/tickets?${params.toString()}`);
      return res.data; // { tickets, total, page, limit }
    },
    staleTime:             0,       // always refetchable
    gcTime:                5 * 60_000,
    refetchInterval:       30_000,  // poll every 30s for list view
    refetchOnWindowFocus:  true,
    placeholderData:       (prev) => prev, // keepPreviousData equivalent in v5
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   useUpdateTicketStatus — mutation with OPTIMISTIC UPDATE
═══════════════════════════════════════════════════════════════════════════ */

/**
 * Usage:
 *   const { mutate: updateStatus, isPending } = useUpdateTicketStatus();
 *   updateStatus({ conversationId: '...', newStatus: 'pending', reason: 'agent_reply' });
 */
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, newStatus, reason = '' }) => {
      const res = await api.patch(`/tickets/${ticketId}/status`, { status: newStatus, reason });
      return res.data.ticket;
    },

    // ── Step 1: Optimistically update cache BEFORE the request completes ──
    onMutate: async ({ conversationId, newStatus, reason }) => {
      // Cancel any in-flight refetches that could overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['ticket', conversationId] });

      // Snapshot the previous value so we can roll back on error
      const previousTicket = queryClient.getQueryData(['ticket', conversationId]);

      // Optimistically update the single ticket cache
      queryClient.setQueryData(['ticket', conversationId], (old) => {
        if (!old) return old;
        return {
          ...old,
          status:    newStatus,
          updatedAt: new Date().toISOString(),
          // Optimistically pause/resume SLA visual:
          slaPausedAt: newStatus === 'pending' ? new Date().toISOString() : null,
        };
      });

      // Also update any list caches that include this ticket
      queryClient.setQueriesData(
        { queryKey: ['tickets'], exact: false },
        (old) => {
          if (!old?.tickets) return old;
          return {
            ...old,
            tickets: old.tickets.map(t =>
              t.conversationId === conversationId
                ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
                : t
            ),
          };
        }
      );

      // Return snapshot for potential rollback
      return { previousTicket, conversationId };
    },

    // ── Step 2: On success, apply server-confirmed data ──
    onSuccess: (serverTicket, variables) => {
      // Replace optimistic data with the real server response
      queryClient.setQueryData(['ticket', variables.conversationId], serverTicket);
    },

    // ── Step 3: On error, roll back to snapshot ──
    onError: (err, variables, context) => {
      console.error('[useUpdateTicketStatus] Mutation failed, rolling back:', err.message);
      if (context?.previousTicket !== undefined) {
        queryClient.setQueryData(
          ['ticket', context.conversationId],
          context.previousTicket
        );
      }
      // Optionally show a toast here
    },

    // ── Step 4: Always refetch after settle (optional — socket handles this too) ──
    // onSettled: (_, __, variables) => {
    //   queryClient.invalidateQueries({ queryKey: ['ticket', variables.conversationId] });
    // },
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   useTicketSocketSync — subscribe to Socket.io events for a ticket
   
   Call this in your EmailDetail / TicketDetail component.
   It joins the ticket room and applies all server-pushed status updates
   directly to the TanStack cache (no refetch — zero extra latency).
═══════════════════════════════════════════════════════════════════════════ */

/**
 * @param {string|null} ticketId         - MongoDB _id of the ticket
 * @param {string|null} conversationId   - Graph conversationId (cache key)
 */
export function useTicketSocketSync(ticketId, conversationId) {
  const queryClient = useQueryClient();

  const handleStatusUpdate = useCallback((payload) => {
    if (payload.conversationId !== conversationId) return;

    const isLocked = isPendingTicketLocked(conversationId);
    if (isLocked && payload.status === 'open' && payload.reason !== 'customer_reply') {
      console.debug('[socket] Ignoring status update; pending lock is active.');
      return;
    }

    if (payload.reason === 'customer_reply') {
      unlockPendingTicketStatus(conversationId);
    }

    console.log(
      `[socket] ticket:statusUpdated — ${payload.previousStatus} → ${payload.status} (${payload.reason})`
    );

    // Apply server-confirmed update to cache
    queryClient.setQueryData(['ticket', conversationId], (old) => {
      if (!old) return old;
      return {
        ...old,
        status:           payload.status,
        customerStatus:   payload.customerStatus,
        slaDeadline:      payload.slaDeadline,
        slaPausedAt:      payload.slaPausedAt,
        slaTotalPausedMs: payload.slaTotalPausedMs,
        slaExpired:       payload.slaExpired ?? old.slaExpired,
        updatedAt:        payload.updatedAt,
      };
    });

    // Also update list view
    queryClient.setQueriesData(
      { queryKey: ['tickets'], exact: false },
      (old) => {
        if (!old?.tickets) return old;
        return {
          ...old,
          tickets: old.tickets.map(t =>
            t.conversationId === conversationId
              ? { ...t, status: payload.status, customerStatus: payload.customerStatus, updatedAt: payload.updatedAt }
              : t
          ),
        };
      }
    );
  }, [conversationId, queryClient]);

  useEffect(() => {
    if (!ticketId || !conversationId) return;

    // Join the ticket-specific Socket.io room
    socket.emit('joinTicket', ticketId);
    socket.on('ticket:statusUpdated', handleStatusUpdate);

    return () => {
      socket.emit('leaveTicket', ticketId);
      socket.off('ticket:statusUpdated', handleStatusUpdate);
    };
  }, [ticketId, conversationId, handleStatusUpdate]);
}

/* ═══════════════════════════════════════════════════════════════════════════
   useSlaTimer — live countdown that ticks every second
   
   Reads slaDeadline / slaPausedAt / slaTotalPausedMs from the ticket cache
   and returns a live `remainingMs` value that the UI can display.
═══════════════════════════════════════════════════════════════════════════ */

/**
 * @param {{ slaDeadline, slaPausedAt, slaTotalPausedMs, slaExpired }} ticket
 * @returns {{ remainingMs: number, isExpired: boolean, isPaused: boolean }}
 */
export function useSlaTimer(ticket) {
  const [remainingMs, setRemainingMs] = useState(0);

  // Treat as paused if:
  //  1. slaPausedAt is set by the backend (confirmed pause), OR
  //  2. status is 'pending' (optimistic — agent just sent a reply and the
  //     backend hasn't confirmed slaPausedAt yet via socket)
  const isPaused = !!(ticket?.slaPausedAt || ticket?.status === 'pending');

  useEffect(() => {
    if (!ticket?.slaDeadline) {
      setRemainingMs(Infinity);
      return;
    }

    function compute() {
      const deadlineMs = new Date(ticket.slaDeadline).getTime();
      const now        = Date.now();

      // If paused via slaPausedAt, add the in-progress pause duration
      // so the displayed value stays frozen at the correct remaining time.
      const currentPauseMs = ticket.slaPausedAt
        ? now - new Date(ticket.slaPausedAt).getTime()
        : 0;

      const remaining = deadlineMs
        + (ticket.slaTotalPausedMs || 0)
        + currentPauseMs
        - now;

      return Math.max(0, remaining);
    }

    setRemainingMs(compute());

    // Stop ticking when paused (status=pending or slaPausedAt set)
    if (isPaused) return;

    const timer = setInterval(() => {
      const ms = compute();
      setRemainingMs(ms);
      if (ms <= 0) clearInterval(timer);
    }, 1_000);

    return () => clearInterval(timer);
  }, [ticket?.slaDeadline, ticket?.slaPausedAt, ticket?.slaTotalPausedMs, isPaused]);

  return {
    remainingMs,
    isExpired: ticket?.slaExpired || remainingMs === 0,
    isPaused,
  };
}