import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * useNotifAutoOpen
 *
 * Reads `location.state.openId` placed by the notification dropdown
 * and calls `onOpen(id)` once so the host page can open its View modal
 * for that specific record.
 *
 * After consuming the state it replaces the history entry with a clean
 * state so a page refresh / back-navigation doesn't re-trigger the modal.
 *
 * Usage in BugReports.js:
 *   useNotifAutoOpen((bugId) => {
 *     const found = bugs.find(b => b._id === bugId);
 *     if (found) { setSelectedBug(found); setViewModalOpen(true); }
 *   });
 *
 * Usage in ActivityLogs.js:
 *   useNotifAutoOpen((logId) => {
 *     const found = logs.find(l => l._id === logId);
 *     if (found) { setSelectedLog(found); setViewModalOpen(true); }
 *   });
 *
 * @param {(id: string) => void} onOpen  Called with the raw string id.
 * @param {any[]}               deps    Extra deps that gate the effect
 *                                       (pass your loaded data array so
 *                                       the hook waits until data is ready).
 */
export function useNotifAutoOpen(onOpen, deps = []) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const { openId, fromNotification } = location.state || {};
    if (!openId || !fromNotification) return;

    // Call the host page's open handler
    onOpen(openId);

    // Clean up router state so refresh / back doesn't re-open the modal
    navigate(location.pathname, { replace: true, state: {} });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, ...deps]);
}