/**
 * hooks/useFolderMessages.js
 *
 * Fetches + processes messages for a given Graph mail folder.
 * Uses TanStack Query v5 for caching, background refresh, and instant
 * folder-switching via keepPreviousData.
 *
 * KEY DESIGN DECISIONS
 * ────────────────────
 * 1. Query key is ['messages', folderId] — stable, per-folder cache.
 * 2. staleTime = 0 → always refetchable; background folders use 5 min staleTime.
 * 3. refetchInterval = 20s (active folder only, window-focused) → inbox stays fresh.
 * 4. placeholderData: keepPreviousData → folder list stays visible instantly when switching.
 * 5. Body is intentionally omitted from the list fetch — fetched lazily in the thread viewer.
 * 6. Deduplication: one row per conversationId (NEWEST = latest reply shown), sorted newest-first.
 *
 * BUG FIX (sorting)
 * ──────────────────
 * Previously, processMessages sorted oldest→newest before deduplicating,
 * which kept the thread ROOT (oldest message) as the representative row.
 * This caused the final "sort by latest activity" to be unreliable when
 * the API's top-50 cap excluded recent replies from other threads.
 *
 * Fix: sort NEWEST→OLDEST first so the most-recent reply per conversation
 * is kept as the representative row, then re-sort deduped list newest-first.
 * The API is also told to return messages ordered by receivedDateTime desc.
 *
 * NEW MESSAGE NOTIFICATION SYSTEM
 * ─────────────────────────────────
 * useNewMessageNotifier(folderId, enabled)
 *   → Compares the latest fetch against the previous snapshot.
 *   → Returns { newCount, newMessages, clearNew } so the UI can show badges.
 *   → newMessages are messages whose `id` was not present in the previous data set.
 *   → clearNew() resets the counter (call when user opens the folder/tab).
 *
 * FOLDER ID MAP (Graph well-known names)
 * ────────────────────────────────────────
 *  inbox       → Inbox
 *  sentitems   → Sent Items
 *  drafts      → Drafts
 *  deleteditems→ Trash
 *  junkemail   → Spam
 *  archive     → Archive
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useRef, useEffect, useState, useCallback } from 'react';
import api from '../services/api'; // your existing axios instance

/* ── Avatar colour palette (matches MessagingPage) ─────────────────────── */
const AVATAR_COLORS = [
  '#9b1c1c', '#b91c1c', '#9d174d', '#7c2d12',
  '#059669', '#d97706', '#2563eb', '#7c3aed',
];

/* ── Map tab key → Graph well-known folder name ─────────────────────────── */
export const TAB_TO_FOLDER = {
  inbox:      'inbox',
  sent:       'sentitems',
  all:        'inbox',        // "All Mail" — treat as inbox; adjust if you have an archive folder
  drafts:     'drafts',
  trash:      'deleteditems',
  spam:       'junkemail',
  favourites: 'inbox',        // Graph has no starred folder — filter client-side
};

/* ── Date formatter (lightweight, no i18n library needed) ───────────────── */
function formatGraphDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (new Date(now - 86_400_000).toDateString() === d.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/* ── Map a raw Graph message → UI-friendly shape ────────────────────────── */
//
// IMPORTANT: `body` is intentionally NOT included here.
// The list view only needs bodyPreview (lightweight).
// The full body is fetched on-demand in useThread → EmailDetail.
//
export function mapGraphEmail(m) {
  const from     = m.from?.emailAddress;
  const name     = from?.name || from?.address || '?';
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const colorIdx = (from?.address || '').charCodeAt(0) % AVATAR_COLORS.length;

  return {
    // Identifiers
    id:             m.id,
    msId:           m.id,
    graphId:        m.id,
    conversationId: m.conversationId ?? null,

    // Display
    sender:         name,
    senderEmail:    from?.address ?? '',
    subject:        m.subject || '(no subject)',
    preview:        m.bodyPreview ?? '',   // ← bodyPreview only; body fetched lazily
    time:           formatGraphDate(m.receivedDateTime),
    receivedAt:     m.receivedDateTime ?? null,

    // State
    read:           m.isRead ?? true,
    starred:        m.flag?.flagStatus === 'flagged',
    hasAttachments: m.hasAttachments ?? false,

    // Avatar
    avatar:         initials,
    avatarColor:    AVATAR_COLORS[colorIdx],

    // Recipients (display names preferred over raw addresses)
    to:  (m.toRecipients  ?? []).map(r => r.emailAddress?.name || r.emailAddress?.address),
    cc:  (m.ccRecipients  ?? []).map(r => r.emailAddress?.name || r.emailAddress?.address),

    // Meta
    status: 'open',
    source: 'outlook',
  };
}

/* ── Deduplicate + sort by most-recent conversation activity ─────────────── */
//
// FIX: Sort NEWEST→OLDEST first so the most-recent reply per conversation
// is the row we keep. This ensures the preview/subject shown is always the
// latest, and the final activity sort is based on real newest timestamps.
//
function processMessages(rawMessages) {
  const mapped = rawMessages.map(mapGraphEmail);

  // Step 1: sort NEWEST → OLDEST (so newest reply is the representative row)
  const sorted = [...mapped].sort(
    (a, b) => new Date(b.receivedAt ?? 0) - new Date(a.receivedAt ?? 0)
  );

  // Step 2: deduplicate — keep NEWEST message per conversation
  const seenConv = new Set();
  const deduped  = sorted.filter(m => {
    const key = m.conversationId ?? m.id;
    if (seenConv.has(key)) return false;
    seenConv.add(key);
    return true;
  });

  // Step 3: build latest-activity map — first encounter per key IS the latest
  // (already newest-first from Step 1, so no need for max comparison)
  const convLatest = new Map();
  sorted.forEach(m => {
    const key = m.conversationId ?? m.id;
    if (!convLatest.has(key)) {
      convLatest.set(key, new Date(m.receivedAt ?? 0).getTime());
    }
  });

  // Step 4: sort deduped rows by most-recent activity (newest first)
  deduped.sort((a, b) => {
    const ta = convLatest.get(a.conversationId ?? a.id) ?? 0;
    const tb = convLatest.get(b.conversationId ?? b.id) ?? 0;
    return tb - ta;
  });

  return deduped;
}

/* ── Fetcher (called by TanStack Query) ─────────────────────────────────── */
async function fetchFolderMessages(folderId) {
  const res = await api.get(`/email/folders/${folderId}/messages`, {
    params: {
      top: 50,
      // Request newest first from the server so the 50-message cap
      // always includes the most recent messages across all threads.
      orderby: 'receivedDateTime desc',
    },
  });
  return processMessages(res.data.emails ?? []);
}

/* ══════════════════════════════════════════════════════════════════════════
   useFolderMessages
══════════════════════════════════════════════════════════════════════════ */

/**
 * @param {string}  folderId - Graph well-known folder name or real folder ID.
 *                             Use TAB_TO_FOLDER to map sidebar tab keys.
 * @param {boolean} enabled  - Set false when Outlook is disconnected.
 * @param {boolean} isActive - Set false for background folders (reduces polling).
 *
 * Returns standard TanStack Query result object:
 *   { data, isLoading, isFetching, isError, error, refetch }
 *
 * `data` is an array of UI-shaped email objects (see mapGraphEmail).
 */
export function useFolderMessages(folderId, { enabled = true, isActive = true } = {}) {
  return useQuery({
    queryKey:  ['messages', folderId],
    queryFn:   () => fetchFolderMessages(folderId),
    enabled:   !!folderId && enabled,

    // staleTime: 0 → always stale so refetchInterval fires every time.
    // Background (isActive=false) folders use a longer staleTime to reduce server load.
    staleTime: isActive ? 0 : 5 * 60_000,
    gcTime:    5 * 60_000,

    // Only the active folder polls every 20s.
    // Background folders are fetched once and not polled — they refresh when switched to.
    refetchInterval:             isActive ? 20_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus:        true,

    placeholderData: keepPreviousData,

    retry:      2,
    retryDelay: attempt => Math.min(1_000 * 2 ** attempt, 8_000),
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   useNewMessageNotifier
   ─────────────────────
   Tracks new messages arriving in a folder between polls.

   HOW IT WORKS
   ────────────
   1. On the first successful fetch, the current message IDs are saved as the
      "seen" baseline (seenIds ref). No notification is shown yet.
   2. On every subsequent fetch, incoming IDs are compared against seenIds.
      Any ID not in seenIds → new message.
   3. newMessages state is set to the array of new message objects.
   4. clearNew() merges the new IDs into seenIds and clears the state.
      Call this when the user switches to the folder/tab.

   USAGE in MessagingPage / MessageNavSidebar:
     const { newCount, newMessages, clearNew } = useNewMessageNotifier('inbox', outlookConnected);
     // Pass newCount to MessageNavSidebar for the badge
     // Call clearNew() when user clicks the Inbox nav item
══════════════════════════════════════════════════════════════════════════ */

/**
 * @param {string}  folderId - Graph folder ID (e.g. 'inbox').
 * @param {boolean} enabled  - Set false when Outlook is disconnected.
 *
 * Returns:
 *   {
 *     newCount:    number,           // count of new unread messages since last clearNew()
 *     newMessages: EmailObject[],    // the new message objects
 *     clearNew:    () => void,       // call when user opens the folder
 *   }
 */
export function useNewMessageNotifier(folderId, enabled = true) {
  // Set of message IDs the user has already "seen" (i.e. were present on last clear)
  const seenIds    = useRef(null);   // null = not yet initialised
  const isFirstRef = useRef(true);

  const [newMessages, setNewMessages] = useState([]);

  const { data } = useFolderMessages(folderId, { enabled, isActive: true });

  useEffect(() => {
    if (!data || data.length === 0) return;

    const currentIds = new Set(data.map(m => m.id));

    // First load — establish baseline silently (no notification)
    if (isFirstRef.current || seenIds.current === null) {
      seenIds.current = currentIds;
      isFirstRef.current = false;
      return;
    }

    // Subsequent polls — find IDs not in the baseline
    const arrived = data.filter(m => !seenIds.current.has(m.id));

    if (arrived.length > 0) {
      setNewMessages(prev => {
        // Merge, avoid duplicates
        const existingIds = new Set(prev.map(m => m.id));
        const merged = [...prev, ...arrived.filter(m => !existingIds.has(m.id))];
        return merged;
      });
    }
  }, [data]);

  // Call this when the user opens / switches to the folder
  const clearNew = useCallback(() => {
    if (data) {
      seenIds.current = new Set(data.map(m => m.id));
    }
    setNewMessages([]);
  }, [data]);

  return {
    newCount:    newMessages.length,
    newMessages,
    clearNew,
  };
}