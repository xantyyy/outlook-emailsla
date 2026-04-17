import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  RefreshCw,
  Download,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Ticket,
  Clock,
  TrendingUp,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import './departmentLogs.css';

/* ─────────────────────────────────────────
   MOCK DATA  (replace with API call)
───────────────────────────────────────── */
const MOCK_DEPARTMENTS = [
  {
    id: 1,
    name: 'Engineering',
    code: 'ENG',
    color: '#2563EB',
    bg: '#EFF6FF',
    totalTickets: 142,
    resolved: 130,
    pending: 12,
    breached: 4,
    complianceRate: 91.5,
    avgResponseHrs: 2.3,
    status: 'compliant',
    lastUpdated: '2025-07-15T09:30:00',
    lead: 'J. Reyes',
  },
  {
    id: 2,
    name: 'Product',
    code: 'PRD',
    color: '#7C3AED',
    bg: '#F5F3FF',
    totalTickets: 87,
    resolved: 74,
    pending: 13,
    breached: 9,
    complianceRate: 74.2,
    avgResponseHrs: 5.1,
    status: 'at-risk',
    lastUpdated: '2025-07-15T08:45:00',
    lead: 'M. Santos',
  },
  {
    id: 3,
    name: 'Customer Support',
    code: 'CS',
    color: '#16A34A',
    bg: '#F0FDF4',
    totalTickets: 310,
    resolved: 304,
    pending: 6,
    breached: 2,
    complianceRate: 98.1,
    avgResponseHrs: 0.9,
    status: 'compliant',
    lastUpdated: '2025-07-15T10:00:00',
    lead: 'L. Cruz',
  },
  {
    id: 4,
    name: 'Quality Assurance',
    code: 'QA',
    color: '#D97706',
    bg: '#FFFBEB',
    totalTickets: 65,
    resolved: 50,
    pending: 15,
    breached: 11,
    complianceRate: 61.5,
    avgResponseHrs: 7.8,
    status: 'non-compliant',
    lastUpdated: '2025-07-14T17:20:00',
    lead: 'A. Flores',
  },
  {
    id: 5,
    name: 'DevOps',
    code: 'OPS',
    color: '#0891B2',
    bg: '#ECFEFF',
    totalTickets: 54,
    resolved: 50,
    pending: 4,
    breached: 1,
    complianceRate: 94.4,
    avgResponseHrs: 1.7,
    status: 'compliant',
    lastUpdated: '2025-07-15T09:55:00',
    lead: 'R. Garcia',
  },
  {
    id: 6,
    name: 'Design',
    code: 'DSN',
    color: '#DB2777',
    bg: '#FDF2F8',
    totalTickets: 38,
    resolved: 30,
    pending: 8,
    breached: 6,
    complianceRate: 68.4,
    avgResponseHrs: 6.2,
    status: 'at-risk',
    lastUpdated: '2025-07-14T16:10:00',
    lead: 'C. Aquino',
  },
  {
    id: 7,
    name: 'Marketing',
    code: 'MKT',
    color: '#EA580C',
    bg: '#FFF7ED',
    totalTickets: 29,
    resolved: 27,
    pending: 2,
    breached: 0,
    complianceRate: 100,
    avgResponseHrs: 1.2,
    status: 'compliant',
    lastUpdated: '2025-07-15T07:30:00',
    lead: 'S. Dela Rosa',
  },
  {
    id: 8,
    name: 'Finance',
    code: 'FIN',
    color: '#475569',
    bg: '#F8FAFC',
    totalTickets: 22,
    resolved: 14,
    pending: 8,
    breached: 7,
    complianceRate: 50.0,
    avgResponseHrs: 9.4,
    status: 'non-compliant',
    lastUpdated: '2025-07-13T15:00:00',
    lead: 'P. Villanueva',
  },
];

const ROWS_PER_PAGE = 6;

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const getComplianceClass = (rate) => {
  if (rate >= 85) return 'high';
  if (rate >= 65) return 'medium';
  return 'low';
};

const getRespTimeClass = (hrs) => {
  if (hrs <= 2) return 'fast';
  if (hrs <= 5) return 'medium';
  return 'slow';
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
};

/* ─────────────────────────────────────────
   SORT ICON COMPONENT
───────────────────────────────────────── */
const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field)
    return <ArrowUpDown size={12} className="sort-icon" />;
  return sortDir === 'asc'
    ? <ArrowUp size={12} className="sort-icon active" />
    : <ArrowDown size={12} className="sort-icon active" />;
};

/* ─────────────────────────────────────────
   SUMMARY CARDS
───────────────────────────────────────── */
const SummaryCards = ({ data }) => {
  const total    = data.reduce((s, d) => s + d.totalTickets, 0);
  const compliant = data.filter(d => d.status === 'compliant').length;
  const atRisk   = data.filter(d => d.status === 'at-risk').length;
  const nonComp  = data.filter(d => d.status === 'non-compliant').length;
  const avgRate  = data.length
    ? (data.reduce((s, d) => s + d.complianceRate, 0) / data.length).toFixed(1)
    : 0;

  const cards = [
    {
      label: 'Total Tickets',
      value: total,
      icon: Ticket,
      iconClass: 'blue',
      trend: '+12 this week',
      trendClass: 'up',
    },
    {
      label: 'Compliant Depts',
      value: compliant,
      icon: CheckCircle2,
      iconClass: 'green',
      trend: `${((compliant / data.length) * 100).toFixed(0)}% of total`,
      trendClass: 'neutral',
    },
    {
      label: 'At Risk / Breached',
      value: atRisk + nonComp,
      icon: AlertTriangle,
      iconClass: 'amber',
      trend: atRisk + nonComp > 0 ? 'Needs attention' : 'All clear',
      trendClass: atRisk + nonComp > 0 ? 'down' : 'up',
    },
    {
      label: 'Avg Compliance Rate',
      value: `${avgRate}%`,
      icon: TrendingUp,
      iconClass: 'red',
      trend: avgRate >= 85 ? 'On track' : 'Below target',
      trendClass: avgRate >= 85 ? 'up' : 'down',
    },
  ];

  return (
    <div className="dept-stat-cards">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div className="dept-stat-card" key={c.label}>
            <div className={`stat-card-icon ${c.iconClass}`}>
              <Icon size={20} />
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">{c.label}</div>
              <div className="stat-card-value">{c.value}</div>
              <div className={`stat-card-trend ${c.trendClass}`}>
                {c.trend}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const DepartmentLogs = () => {
  /* ── state ── */
  const [data, setData]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [dateFilter, setDateFilter]   = useState('all');
  const [sortField, setSortField]     = useState('name');
  const [sortDir, setSortDir]         = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  /* ── fetch (mock) ── */
  const fetchData = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    // Simulate API latency
    setTimeout(() => {
      setData(MOCK_DEPARTMENTS);
      setLoading(false);
      setRefreshing(false);
    }, 800);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── filter + sort ── */
  const filtered = useMemo(() => {
    let rows = [...data];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        d => d.name.toLowerCase().includes(q) ||
             d.code.toLowerCase().includes(q) ||
             d.lead.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all')
      rows = rows.filter(d => d.status === statusFilter);

    if (complianceFilter === 'high')
      rows = rows.filter(d => d.complianceRate >= 85);
    else if (complianceFilter === 'medium')
      rows = rows.filter(d => d.complianceRate >= 65 && d.complianceRate < 85);
    else if (complianceFilter === 'low')
      rows = rows.filter(d => d.complianceRate < 65);

    // date filter is illustrative — in real app filter by lastUpdated
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      rows = rows.filter(d => new Date(d.lastUpdated).toDateString() === today);
    }

    rows.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [data, searchQuery, statusFilter, complianceFilter, dateFilter, sortField, sortDir]);

  /* reset page when filters change */
  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, complianceFilter, dateFilter]);

  /* ── pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated  = filtered.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  /* ── sort handler ── */
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  /* ── export (stub) ── */
  const handleExport = () => {
    const headers = ['Department', 'Code', 'Status', 'Compliance %', 'Total Tickets', 'Avg Response (hrs)', 'Lead'];
    const rows    = filtered.map(d => [
      d.name, d.code, d.status, d.complianceRate, d.totalTickets, d.avgResponseHrs, d.lead
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'department-logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setComplianceFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || complianceFilter !== 'all' || dateFilter !== 'all';

  /* ── skeleton rows ── */
  const SkeletonRows = () =>
    Array.from({ length: ROWS_PER_PAGE }).map((_, i) => (
      <tr key={i} className="skeleton-row">
        {[120, 90, 140, 80, 100, 90, 80].map((w, j) => (
          <td key={j}>
            <div className={`skeleton skeleton-cell ${w < 100 ? 'short' : 'long'}`}
              style={{ width: w }} />
          </td>
        ))}
      </tr>
    ));

  /* ─── RENDER ─── */
  return (
    <div className="dept-logs-page">

      {/* ── Page Header ── */}
      <div className="dept-logs-header">
        <div className="dept-logs-title-group">
          <h1 className="dept-logs-title">Department Logs</h1>
          <p className="dept-logs-subtitle">
            SLA compliance and response metrics per department
          </p>
        </div>
        <div className="dept-logs-header-actions">
          <button className="btn-export" onClick={handleExport}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button className="btn-refresh" onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw
              size={15}
              className={`btn-refresh-icon ${refreshing ? 'spinning' : ''}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <SummaryCards data={data} />

      {/* ── Filters Bar ── */}
      <div className="dept-filters-bar">

        {/* Search */}
        <div className="filter-search-wrapper">
          <span className="filter-search-icon">
            <Search size={14} />
          </span>
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search department or lead..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-divider" />

        {/* Status filter */}
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <div className="filter-select-wrapper">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="compliant">Compliant</option>
              <option value="at-risk">At Risk</option>
              <option value="non-compliant">Non-Compliant</option>
            </select>
          </div>
        </div>

        {/* Compliance filter */}
        <div className="filter-group">
          <label className="filter-label">Compliance</label>
          <div className="filter-select-wrapper">
            <select
              className="filter-select"
              value={complianceFilter}
              onChange={e => setComplianceFilter(e.target.value)}
            >
              <option value="all">All Rates</option>
              <option value="high">High ≥ 85%</option>
              <option value="medium">Medium 65–84%</option>
              <option value="low">Low &lt; 65%</option>
            </select>
          </div>
        </div>

        {/* Date filter */}
        <div className="filter-group">
          <label className="filter-label">Period</label>
          <div className="filter-select-wrapper">
            <select
              className="filter-select"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <button className="btn-clear-filters" onClick={clearFilters}>
            <X size={13} />
            Clear
          </button>
        )}
      </div>

      {/* ── Data Table ── */}
      <div className="dept-table-section">

        {/* Table header */}
        <div className="dept-table-header">
          <div>
            <div className="dept-table-title">Department Overview</div>
            <div className="dept-table-meta">
              {loading ? 'Loading...' : `${filtered.length} department${filtered.length !== 1 ? 's' : ''} found`}
            </div>
          </div>
          <div className="dept-table-actions">
            <button className="btn-icon" title="Filter options">
              <SlidersHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable table */}
        <div className="dept-table-scroll">
          <table className="dept-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>
                  <span className="th-sort">
                    Department
                    <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                  </span>
                </th>
                <th onClick={() => handleSort('status')}>
                  <span className="th-sort">
                    Status
                    <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
                  </span>
                </th>
                <th onClick={() => handleSort('complianceRate')}>
                  <span className="th-sort">
                    Compliance Rate
                    <SortIcon field="complianceRate" sortField={sortField} sortDir={sortDir} />
                  </span>
                </th>
                <th onClick={() => handleSort('totalTickets')}>
                  <span className="th-sort">
                    Tickets
                    <SortIcon field="totalTickets" sortField={sortField} sortDir={sortDir} />
                  </span>
                </th>
                <th onClick={() => handleSort('avgResponseHrs')}>
                  <span className="th-sort">
                    Avg Response
                    <SortIcon field="avgResponseHrs" sortField={sortField} sortDir={sortDir} />
                  </span>
                </th>
                <th onClick={() => handleSort('lastUpdated')}>
                  <span className="th-sort">
                    Last Updated
                    <SortIcon field="lastUpdated" sortField={sortField} sortDir={sortDir} />
                  </span>
                </th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="dept-table-empty">
                      <div className="empty-icon">
                        <Building2 size={24} />
                      </div>
                      <div className="empty-title">No departments found</div>
                      <div className="empty-desc">Try adjusting your filters or search query.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((dept) => {
                  const compClass = getComplianceClass(dept.complianceRate);
                  const respClass = getRespTimeClass(dept.avgResponseHrs);
                  return (
                    <tr key={dept.id}>

                      {/* Department name */}
                      <td>
                        <div className="dept-name-cell">
                          <div
                            className="dept-avatar"
                            style={{ background: dept.bg, color: dept.color }}
                          >
                            {dept.code}
                          </div>
                          <div>
                            <div className="dept-name-text">{dept.name}</div>
                            <div className="dept-code-text">Lead: {dept.lead}</div>
                          </div>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td>
                        <span className={`status-badge ${dept.status}`}>
                          {dept.status === 'compliant'
                            ? 'Compliant'
                            : dept.status === 'at-risk'
                              ? 'At Risk'
                              : 'Non-Compliant'}
                        </span>
                      </td>

                      {/* Compliance bar */}
                      <td>
                        <div className="compliance-cell">
                          <div className="compliance-bar-track">
                            <div
                              className={`compliance-bar-fill ${compClass}`}
                              style={{ width: `${dept.complianceRate}%` }}
                            />
                          </div>
                          <span className={`compliance-pct ${compClass}`}>
                            {dept.complianceRate}%
                          </span>
                        </div>
                      </td>

                      {/* Tickets */}
                      <td>
                        <div className="tickets-cell">
                          <span className="tickets-total">{dept.totalTickets}</span>
                          <span className="tickets-breakdown">
                            {dept.resolved} resolved · {dept.pending} pending
                            {dept.breached > 0 && ` · ${dept.breached} breached`}
                          </span>
                        </div>
                      </td>

                      {/* Avg response */}
                      <td>
                        <span className={`resp-time ${respClass}`}>
                          {dept.avgResponseHrs}h
                        </span>
                      </td>

                      {/* Last updated */}
                      <td style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                        {formatDate(dept.lastUpdated)}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="action-cell">
                          <button className="btn-view-detail">
                            <Eye size={13} />
                            View
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > ROWS_PER_PAGE && (
          <div className="dept-table-footer">
            <div className="pagination-info">
              Showing {((currentPage - 1) * ROWS_PER_PAGE) + 1}–
              {Math.min(currentPage * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
            </div>
            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                <button
                  key={pg}
                  className={`page-btn ${pg === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pg)}
                >
                  {pg}
                </button>
              ))}

              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DepartmentLogs;