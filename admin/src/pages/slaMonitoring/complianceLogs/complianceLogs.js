import React, { useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  Eye,
  X,
  Calendar,
  Tag,
  User,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import './complianceLogs.css';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_LOGS = [
  { id: 'LOG-001', ticketId: 'BUG-1042', title: 'Login page crash on Safari', department: 'Engineering', assignee: 'Maria Santos', priority: 'Critical', status: 'Compliant', responseTime: 1.2, resolutionTime: 4.5, slaDeadline: '2025-06-10 09:00', resolvedAt: '2025-06-10 07:30', breach: false, category: 'Bug' },
  { id: 'LOG-002', ticketId: 'BUG-1043', title: 'Payment gateway timeout', department: 'Backend', assignee: 'Juan Dela Cruz', priority: 'High', status: 'Breached', responseTime: 6.8, resolutionTime: 28.3, slaDeadline: '2025-06-10 14:00', resolvedAt: '2025-06-11 18:20', breach: true, category: 'Bug' },
  { id: 'LOG-003', ticketId: 'BUG-1044', title: 'Map pins not loading', department: 'Frontend', assignee: 'Ana Reyes', priority: 'Medium', status: 'Compliant', responseTime: 2.1, resolutionTime: 11.0, slaDeadline: '2025-06-11 10:00', resolvedAt: '2025-06-11 08:45', breach: false, category: 'Feature' },
  { id: 'LOG-004', ticketId: 'BUG-1045', title: 'Profile photo upload error', department: 'Engineering', assignee: 'Carlo Bautista', priority: 'Low', status: 'At Risk', responseTime: 3.9, resolutionTime: null, slaDeadline: '2025-06-13 17:00', resolvedAt: null, breach: false, category: 'Bug' },
  { id: 'LOG-005', ticketId: 'BUG-1046', title: 'Email notifications not sent', department: 'Backend', assignee: 'Lea Mendoza', priority: 'High', status: 'Compliant', responseTime: 1.8, resolutionTime: 9.2, slaDeadline: '2025-06-11 16:00', resolvedAt: '2025-06-11 14:10', breach: false, category: 'Bug' },
  { id: 'LOG-006', ticketId: 'BUG-1047', title: 'Dark mode toggle broken', department: 'Frontend', assignee: 'Ricky Gomez', priority: 'Low', status: 'Compliant', responseTime: 4.2, resolutionTime: 20.0, slaDeadline: '2025-06-14 09:00', resolvedAt: '2025-06-14 08:00', breach: false, category: 'Feature' },
  { id: 'LOG-007', ticketId: 'BUG-1048', title: 'Search results returning 500', department: 'Backend', assignee: 'Diana Lim', priority: 'Critical', status: 'Breached', responseTime: 5.5, resolutionTime: 18.7, slaDeadline: '2025-06-09 12:00', resolvedAt: '2025-06-10 06:40', breach: true, category: 'Bug' },
  { id: 'LOG-008', ticketId: 'BUG-1049', title: 'Booking confirmation email delay', department: 'Engineering', assignee: 'Mark Villanueva', priority: 'Medium', status: 'Compliant', responseTime: 2.5, resolutionTime: 13.1, slaDeadline: '2025-06-12 11:00', resolvedAt: '2025-06-12 09:55', breach: false, category: 'Bug' },
  { id: 'LOG-009', ticketId: 'BUG-1050', title: 'Dashboard charts not rendering', department: 'Frontend', assignee: 'Sofia Tan', priority: 'High', status: 'At Risk', responseTime: 3.0, resolutionTime: null, slaDeadline: '2025-06-12 18:00', resolvedAt: null, breach: false, category: 'Bug' },
  { id: 'LOG-010', ticketId: 'BUG-1051', title: 'User role permissions bug', department: 'Engineering', assignee: 'Jerome Castro', priority: 'Critical', status: 'Compliant', responseTime: 0.9, resolutionTime: 5.8, slaDeadline: '2025-06-08 08:00', resolvedAt: '2025-06-08 06:45', breach: false, category: 'Bug' },
  { id: 'LOG-011', ticketId: 'BUG-1052', title: 'CSV export corrupted data', department: 'Backend', assignee: 'Noel Aquino', priority: 'Medium', status: 'Breached', responseTime: 8.1, resolutionTime: 33.4, slaDeadline: '2025-06-07 15:00', resolvedAt: '2025-06-09 00:20', breach: true, category: 'Feature' },
  { id: 'LOG-012', ticketId: 'BUG-1053', title: 'Wishlist sync across devices', department: 'Frontend', assignee: 'Gina Pascual', priority: 'Low', status: 'Compliant', responseTime: 3.3, resolutionTime: 22.6, slaDeadline: '2025-06-15 10:00', resolvedAt: '2025-06-15 09:20', breach: false, category: 'Feature' },
];

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const STATUS_OPTIONS = ['All', 'Compliant', 'Breached', 'At Risk'];
const PRIORITY_OPTIONS = ['All', 'Critical', 'High', 'Medium', 'Low'];
const DEPARTMENT_OPTIONS = ['All', 'Engineering', 'Backend', 'Frontend'];

// ─── Sub-Components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    Compliant: { icon: CheckCircle2, cls: 'badge-compliant' },
    Breached:  { icon: XCircle,      cls: 'badge-breached'  },
    'At Risk': { icon: AlertTriangle, cls: 'badge-atrisk'   },
  };
  const { icon: Icon, cls } = map[status] || {};
  return (
    <span className={`status-badge ${cls}`}>
      <Icon size={12} /> {status}
    </span>
  );
};

const PriorityBadge = ({ priority }) => (
  <span className={`priority-badge priority-${priority.toLowerCase()}`}>{priority}</span>
);

const TrendIcon = ({ value }) => {
  if (value > 5) return <TrendingDown size={14} className="trend-bad" />;
  if (value < 2) return <TrendingUp    size={14} className="trend-good" />;
  return <Minus size={14} className="trend-neutral" />;
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const DetailModal = ({ log, onClose }) => {
  if (!log) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-ticket-id">{log.ticketId}</span>
            <h3 className="modal-title">{log.title}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="modal-badges">
            <StatusBadge status={log.status} />
            <PriorityBadge priority={log.priority} />
            <span className="modal-category"><Tag size={12} /> {log.category}</span>
          </div>

          <div className="modal-grid">
            <div className="modal-info-card">
              <span className="modal-info-label"><User size={13} /> Assignee</span>
              <span className="modal-info-value">{log.assignee}</span>
            </div>
            <div className="modal-info-card">
              <span className="modal-info-label"><Building2 size={13} /> Department</span>
              <span className="modal-info-value">{log.department}</span>
            </div>
            <div className="modal-info-card">
              <span className="modal-info-label"><Clock size={13} /> Response Time</span>
              <span className="modal-info-value">{log.responseTime}h</span>
            </div>
            <div className="modal-info-card">
              <span className="modal-info-label"><Clock size={13} /> Resolution Time</span>
              <span className="modal-info-value">{log.resolutionTime ? `${log.resolutionTime}h` : 'Pending'}</span>
            </div>
            <div className="modal-info-card">
              <span className="modal-info-label"><Calendar size={13} /> SLA Deadline</span>
              <span className="modal-info-value">{log.slaDeadline}</span>
            </div>
            <div className="modal-info-card">
              <span className="modal-info-label"><Calendar size={13} /> Resolved At</span>
              <span className="modal-info-value">{log.resolvedAt || '—'}</span>
            </div>
          </div>

          {log.breach && (
            <div className="modal-breach-alert">
              <AlertTriangle size={16} />
              <span>This ticket breached SLA. Resolution exceeded the agreed deadline.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ComplianceLogs = () => {
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState('All');
  const [priorityFilter, setPriority] = useState('All');
  const [deptFilter, setDept]         = useState('All');
  const [sortKey, setSortKey]         = useState('id');
  const [sortDir, setSortDir]         = useState('asc');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const stats = useMemo(() => {
    const total     = MOCK_LOGS.length;
    const compliant = MOCK_LOGS.filter(l => l.status === 'Compliant').length;
    const breached  = MOCK_LOGS.filter(l => l.status === 'Breached').length;
    const atRisk    = MOCK_LOGS.filter(l => l.status === 'At Risk').length;
    const rate      = ((compliant / total) * 100).toFixed(1);
    return { total, compliant, breached, atRisk, rate };
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let data = [...MOCK_LOGS];

    if (search)                         data = data.filter(l => l.title.toLowerCase().includes(search.toLowerCase()) || l.ticketId.toLowerCase().includes(search.toLowerCase()) || l.assignee.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter   !== 'All')       data = data.filter(l => l.status === statusFilter);
    if (priorityFilter !== 'All')       data = data.filter(l => l.priority === priorityFilter);
    if (deptFilter     !== 'All')       data = data.filter(l => l.department === deptFilter);

    data.sort((a, b) => {
      let aVal = a[sortKey], bVal = b[sortKey];
      if (sortKey === 'priority') { aVal = PRIORITY_ORDER[a.priority]; bVal = PRIORITY_ORDER[b.priority]; }
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return data;
  }, [search, statusFilter, priorityFilter, deptFilter, sortKey, sortDir]);

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronUp size={13} className="sort-icon-neutral" />;
    return sortDir === 'asc' ? <ChevronUp size={13} className="sort-icon-active" /> : <ChevronDown size={13} className="sort-icon-active" />;
  };

  const handleExport = () => {
    const headers = ['Log ID','Ticket ID','Title','Department','Assignee','Priority','Status','Response Time (h)','Resolution Time (h)','SLA Deadline','Resolved At','Breach'];
    const rows = filtered.map(l => [l.id, l.ticketId, `"${l.title}"`, l.department, l.assignee, l.priority, l.status, l.responseTime, l.resolutionTime ?? '', l.slaDeadline, l.resolvedAt ?? '', l.breach ? 'Yes' : 'No']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'compliance_logs.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cl-page">

      {/* ── Page Header ── */}
      <div className="cl-page-header">
        <div className="cl-page-title-group">
         
          <div>
            <h1 className="cl-page-title">Compliance Logs</h1>
            <p className="cl-page-subtitle">SLA Monitoring · WanderWave Project</p>
          </div>
        </div>
        <button className="cl-export-btn" onClick={handleExport}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="cl-stats-row">
        <div className="cl-stat-card cl-stat-total">
          <span className="cl-stat-label">Total Tickets</span>
          <span className="cl-stat-value">{stats.total}</span>
        </div>
        <div className="cl-stat-card cl-stat-compliant">
          <CheckCircle2 size={18} className="cl-stat-icon" />
          <span className="cl-stat-label">Compliant</span>
          <span className="cl-stat-value">{stats.compliant}</span>
        </div>
        <div className="cl-stat-card cl-stat-breached">
          <XCircle size={18} className="cl-stat-icon" />
          <span className="cl-stat-label">Breached</span>
          <span className="cl-stat-value">{stats.breached}</span>
        </div>
        <div className="cl-stat-card cl-stat-atrisk">
          <AlertTriangle size={18} className="cl-stat-icon" />
          <span className="cl-stat-label">At Risk</span>
          <span className="cl-stat-value">{stats.atRisk}</span>
        </div>
        <div className="cl-stat-card cl-stat-rate">
          <span className="cl-stat-label">Compliance Rate</span>
          <span className="cl-stat-value cl-stat-rate-value">{stats.rate}%</span>
          <div className="cl-rate-bar">
            <div className="cl-rate-fill" style={{ width: `${stats.rate}%` }} />
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="cl-toolbar">
        <div className="cl-search-wrap">
          <Search size={16} className="cl-search-icon" />
          <input
            className="cl-search-input"
            type="text"
            placeholder="Search by title, ticket ID, or assignee..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className={`cl-filter-toggle ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(f => !f)}>
          <Filter size={16} /> Filters {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* ── Filters Panel ── */}
      {showFilters && (
        <div className="cl-filters-panel">
          <div className="cl-filter-group">
            <label className="cl-filter-label">Status</label>
            <div className="cl-filter-pills">
              {STATUS_OPTIONS.map(s => (
                <button key={s} className={`cl-pill ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s}</button>
              ))}
            </div>
          </div>
          <div className="cl-filter-group">
            <label className="cl-filter-label">Priority</label>
            <div className="cl-filter-pills">
              {PRIORITY_OPTIONS.map(p => (
                <button key={p} className={`cl-pill ${priorityFilter === p ? 'active' : ''}`} onClick={() => setPriority(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div className="cl-filter-group">
            <label className="cl-filter-label">Department</label>
            <div className="cl-filter-pills">
              {DEPARTMENT_OPTIONS.map(d => (
                <button key={d} className={`cl-pill ${deptFilter === d ? 'active' : ''}`} onClick={() => setDept(d)}>{d}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="cl-table-wrapper">
        <table className="cl-table">
          <thead>
            <tr>
              {[
                { key: 'id',             label: 'Log ID'       },
                { key: 'ticketId',       label: 'Ticket'       },
                { key: 'title',          label: 'Title'        },
                { key: 'department',     label: 'Department'   },
                { key: 'assignee',       label: 'Assignee'     },
                { key: 'priority',       label: 'Priority'     },
                { key: 'status',         label: 'Status'       },
                { key: 'responseTime',   label: 'Response (h)' },
                { key: 'resolutionTime', label: 'Resolution (h)' },
                { key: 'slaDeadline',    label: 'SLA Deadline' },
              ].map(({ key, label }) => (
                <th key={key} className="cl-th sortable" onClick={() => handleSort(key)}>
                  {label} <SortIcon col={key} />
                </th>
              ))}
              <th className="cl-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="cl-empty-row">
                  <FileText size={32} className="cl-empty-icon" />
                  <p>No logs match the current filters.</p>
                </td>
              </tr>
            ) : (
              filtered.map(log => (
                <tr key={log.id} className={`cl-row ${log.breach ? 'row-breached' : ''}`}>
                  <td className="cl-td cl-td-id">{log.id}</td>
                  <td className="cl-td cl-td-ticket">{log.ticketId}</td>
                  <td className="cl-td cl-td-title" title={log.title}>{log.title}</td>
                  <td className="cl-td">{log.department}</td>
                  <td className="cl-td">{log.assignee}</td>
                  <td className="cl-td"><PriorityBadge priority={log.priority} /></td>
                  <td className="cl-td"><StatusBadge status={log.status} /></td>
                  <td className="cl-td cl-td-time">
                    <TrendIcon value={log.responseTime} />
                    {log.responseTime}h
                  </td>
                  <td className="cl-td cl-td-time">
                    {log.resolutionTime
                      ? <><TrendIcon value={log.resolutionTime / 5} />{log.resolutionTime}h</>
                      : <span className="cl-pending">Pending</span>}
                  </td>
                  <td className="cl-td cl-td-date">{log.slaDeadline}</td>
                  <td className="cl-td">
                    <button className="cl-view-btn" onClick={() => setSelectedLog(log)} title="View Details">
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="cl-table-footer">
        Showing <strong>{filtered.length}</strong> of <strong>{MOCK_LOGS.length}</strong> records
      </div>

      {/* ── Modal ── */}
      <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
};

export default ComplianceLogs;