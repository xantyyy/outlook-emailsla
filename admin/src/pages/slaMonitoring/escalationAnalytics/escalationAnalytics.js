import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  Flame,
  ShieldAlert,
  Target,
  Activity,
} from 'lucide-react';
import './escalationAnalytics.css';

/* ─────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────── */
const MONTHLY_TREND = [
  { month: 'Aug', escalated: 18, resolved: 14, breach: 4 },
  { month: 'Sep', escalated: 24, resolved: 20, breach: 5 },
  { month: 'Oct', escalated: 31, resolved: 25, breach: 8 },
  { month: 'Nov', escalated: 22, resolved: 19, breach: 5 },
  { month: 'Dec', escalated: 15, resolved: 14, breach: 2 },
  { month: 'Jan', escalated: 28, resolved: 22, breach: 7 },
  { month: 'Feb', escalated: 34, resolved: 26, breach: 9 },
];

const DEPARTMENT_DATA = [
  { dept: 'Frontend',   escalated: 14, resolved: 10, rate: 71, color: '#DC2626' },
  { dept: 'Backend',    escalated: 22, resolved: 18, rate: 82, color: '#1D4ED8' },
  { dept: 'Mobile',     escalated:  9, resolved:  8, rate: 89, color: '#059669' },
  { dept: 'DevOps',     escalated: 17, resolved: 12, rate: 71, color: '#D97706' },
  { dept: 'QA',         escalated:  6, resolved:  6, rate: 100,'color': '#7C3AED' },
  { dept: 'Design',     escalated:  4, resolved:  3, rate: 75, color: '#DB2777' },
];

const TOP_ESCALATED = [
  { id: 'BUG-0412', title: 'Payment gateway timeout on checkout', dept: 'Backend',  priority: 'Critical', daysOpen: 8,  breached: true  },
  { id: 'BUG-0389', title: 'Map rendering crash on iOS 17',       dept: 'Mobile',   priority: 'High',     daysOpen: 5,  breached: false },
  { id: 'BUG-0401', title: 'Admin dashboard memory leak',         dept: 'Frontend', priority: 'High',     daysOpen: 11, breached: true  },
  { id: 'BUG-0378', title: 'CI pipeline fails on PR merge',       dept: 'DevOps',   priority: 'Medium',   daysOpen: 3,  breached: false },
  { id: 'BUG-0415', title: 'Notification emails not delivered',   dept: 'Backend',  priority: 'Critical', daysOpen: 6,  breached: true  },
  { id: 'BUG-0398', title: 'Dark mode flicker on page load',      dept: 'Frontend', priority: 'Low',      daysOpen: 2,  breached: false },
];

const RESOLUTION_BUCKETS = [
  { label: '< 1 day',   count: 12 },
  { label: '1–3 days',  count: 28 },
  { label: '3–7 days',  count: 19 },
  { label: '7–14 days', count: 11 },
  { label: '> 14 days', count:  4 },
];

const PRIORITY_BREAKDOWN = [
  { label: 'Critical', count: 9,  color: '#DC2626', pct: 25 },
  { label: 'High',     count: 14, color: '#F97316', pct: 39 },
  { label: 'Medium',   count: 8,  color: '#FBBF24', pct: 22 },
  { label: 'Low',      count: 5,  color: '#6EE7B7', pct: 14 },
];

const DATE_RANGES = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Custom'];

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const MAX_ESCALATED = Math.max(...MONTHLY_TREND.map(d => d.escalated));
const MAX_RESOLUTION = Math.max(...RESOLUTION_BUCKETS.map(d => d.count));
const MAX_DEPT = Math.max(...DEPARTMENT_DATA.map(d => d.escalated));

function StatCard({ icon: Icon, label, value, change, changeLabel, accent, sub }) {
  const up = change >= 0;
  return (
    <div className="ea-stat-card">
      <div className="ea-stat-icon" style={{ background: `${accent}18`, color: accent }}>
        <Icon size={20} />
      </div>
      <div className="ea-stat-body">
        <p className="ea-stat-label">{label}</p>
        <h3 className="ea-stat-value">{value}</h3>
        {sub && <p className="ea-stat-sub">{sub}</p>}
      </div>
      <div className={`ea-stat-change ${up ? 'up' : 'down'}`}>
        {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
        <span>{Math.abs(change)}% {changeLabel}</span>
      </div>
    </div>
  );
}

function TrendBar({ d, maxVal }) {
  const escPct = (d.escalated / maxVal) * 100;
  const resPct  = (d.resolved  / maxVal) * 100;
  return (
    <div className="ea-trend-group">
      <div className="ea-trend-bars">
        <div className="ea-trend-bar-wrap" title={`Escalated: ${d.escalated}`}>
          <div className="ea-trend-bar ea-bar-escalated" style={{ height: `${escPct}%` }} />
        </div>
        <div className="ea-trend-bar-wrap" title={`Resolved: ${d.resolved}`}>
          <div className="ea-trend-bar ea-bar-resolved"  style={{ height: `${resPct}%` }} />
        </div>
      </div>
      <span className="ea-trend-label">{d.month}</span>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const map = {
    Critical: 'ea-badge-critical',
    High:     'ea-badge-high',
    Medium:   'ea-badge-medium',
    Low:      'ea-badge-low',
  };
  return <span className={`ea-badge ${map[priority]}`}>{priority}</span>;
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const EscalationAnalytics = () => {
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <div className={`ea-page ${animateIn ? 'ea-page--in' : ''}`}>

      {/* ── Page Header ── */}
      <div className="ea-page-header">
        <div className="ea-page-title">
          <div className="ea-title-icon">
            <TrendingUp size={18} />
          </div>
          <div>
            <h1>Escalation Analytics</h1>
            <p>Monitor and analyze bug escalation patterns across all departments</p>
          </div>
        </div>

        <div className="ea-page-actions">
          {/* Date Range Selector */}
          <div className="ea-dropdown-wrap" ref={dropRef}>
            <button
              className="ea-btn ea-btn-outline"
              onClick={() => setDropdownOpen(o => !o)}
            >
              <Filter size={14} />
              {dateRange}
              <ChevronDown size={14} className={`ea-chevron ${dropdownOpen ? 'open' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="ea-dropdown-menu">
                {DATE_RANGES.map(r => (
                  <button
                    key={r}
                    className={`ea-dropdown-item ${dateRange === r ? 'active' : ''}`}
                    onClick={() => { setDateRange(r); setDropdownOpen(false); }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className={`ea-btn ea-btn-outline ${loading ? 'ea-btn-spin' : ''}`} onClick={handleRefresh}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          <button className="ea-btn ea-btn-primary">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="ea-stats-grid">
        <StatCard
          icon={ShieldAlert}
          label="Total Escalations"
          value="34"
          change={21}
          changeLabel="vs last month"
          accent="#DC2626"
          sub="Feb 2025"
        />
        <StatCard
          icon={Target}
          label="Resolution Rate"
          value="76.5%"
          change={-4}
          changeLabel="vs last month"
          accent="#1D4ED8"
          sub="26 of 34 resolved"
        />
        <StatCard
          icon={Clock}
          label="Avg. Resolution Time"
          value="4.2d"
          change={-12}
          changeLabel="faster"
          accent="#059669"
          sub="Down from 4.8d"
        />
        <StatCard
          icon={Flame}
          label="SLA Breaches"
          value="9"
          change={29}
          changeLabel="vs last month"
          accent="#F97316"
          sub="26.5% breach rate"
        />
        <StatCard
          icon={Activity}
          label="Active Escalations"
          value="8"
          change={-14}
          changeLabel="vs last week"
          accent="#7C3AED"
          sub="Pending resolution"
        />
        <StatCard
          icon={Users}
          label="Depts. Affected"
          value="6"
          change={0}
          changeLabel="same as last period"
          accent="#DB2777"
          sub="All teams"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="ea-charts-row">

        {/* Monthly Trend Bar Chart */}
        <div className="ea-card ea-card--trend">
          <div className="ea-card-header">
            <div>
              <h2 className="ea-card-title">Monthly Escalation Trend</h2>
              <p className="ea-card-sub">Escalated vs Resolved per month</p>
            </div>
            <div className="ea-legend">
              <span className="ea-legend-dot" style={{ background: '#DC2626' }} />Escalated
              <span className="ea-legend-dot" style={{ background: '#1D4ED8' }} />Resolved
            </div>
          </div>
          <div className="ea-bar-chart">
            {MONTHLY_TREND.map(d => (
              <TrendBar key={d.month} d={d} maxVal={MAX_ESCALATED + 4} />
            ))}
          </div>
          <div className="ea-chart-yaxis">
            {[0, 10, 20, 30, 40].map(v => (
              <span key={v}>{v}</span>
            ))}
          </div>
        </div>

        {/* Priority Donut */}
        <div className="ea-card ea-card--priority">
          <div className="ea-card-header">
            <div>
              <h2 className="ea-card-title">Priority Breakdown</h2>
              <p className="ea-card-sub">Current open escalations</p>
            </div>
          </div>
          <div className="ea-donut-wrap">
            <svg viewBox="0 0 120 120" className="ea-donut-svg">
              {(() => {
                let offset = 0;
                const r = 42, cx = 60, cy = 60;
                const circ = 2 * Math.PI * r;
                return PRIORITY_BREAKDOWN.map(({ label, pct, color }) => {
                  const dash = (pct / 100) * circ;
                  const gap  = circ - dash;
                  const el = (
                    <circle
                      key={label}
                      cx={cx} cy={cy} r={r}
                      fill="none"
                      stroke={color}
                      strokeWidth="14"
                      strokeDasharray={`${dash} ${gap}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="butt"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
                    />
                  );
                  offset += dash;
                  return el;
                });
              })()}
              <text x="60" y="56" textAnchor="middle" className="ea-donut-center-val">36</text>
              <text x="60" y="68" textAnchor="middle" className="ea-donut-center-sub">total</text>
            </svg>
            <div className="ea-donut-legend">
              {PRIORITY_BREAKDOWN.map(({ label, count, color, pct }) => (
                <div key={label} className="ea-donut-legend-row">
                  <span className="ea-donut-dot" style={{ background: color }} />
                  <span className="ea-donut-legend-label">{label}</span>
                  <span className="ea-donut-legend-count">{count}</span>
                  <span className="ea-donut-legend-pct">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Department Performance + Resolution Time ── */}
      <div className="ea-charts-row ea-charts-row--bottom">

        {/* Department horizontal bars */}
        <div className="ea-card ea-card--dept">
          <div className="ea-card-header">
            <div>
              <h2 className="ea-card-title">Department Performance</h2>
              <p className="ea-card-sub">Escalations vs resolution rate</p>
            </div>
          </div>
          <div className="ea-dept-list">
            {DEPARTMENT_DATA.map(({ dept, escalated, resolved, rate, color }) => (
              <div key={dept} className="ea-dept-row">
                <div className="ea-dept-name">
                  <span className="ea-dept-dot" style={{ background: color }} />
                  {dept}
                </div>
                <div className="ea-dept-bar-wrap">
                  <div className="ea-dept-bar-bg">
                    <div
                      className="ea-dept-bar-fill"
                      style={{
                        width: `${(escalated / MAX_DEPT) * 100}%`,
                        background: color,
                      }}
                    />
                  </div>
                  <span className="ea-dept-count">{escalated}</span>
                </div>
                <div className={`ea-dept-rate ${rate >= 90 ? 'rate-high' : rate >= 75 ? 'rate-mid' : 'rate-low'}`}>
                  {rate}%
                </div>
              </div>
            ))}
          </div>
          <div className="ea-dept-legend-row">
            <span className="ea-dept-legend-item"><span style={{ background: '#E5E7EB', display:'inline-block', width:10, height:10, borderRadius:2, marginRight:4 }} />Escalated count</span>
            <span className="ea-dept-legend-item">Resolution rate →</span>
          </div>
        </div>

        {/* Resolution Time Distribution */}
        <div className="ea-card ea-card--resolution">
          <div className="ea-card-header">
            <div>
              <h2 className="ea-card-title">Resolution Time Distribution</h2>
              <p className="ea-card-sub">How long escalations take to close</p>
            </div>
          </div>
          <div className="ea-res-chart">
            {RESOLUTION_BUCKETS.map(({ label, count }) => {
              const pct = (count / MAX_RESOLUTION) * 100;
              return (
                <div key={label} className="ea-res-row">
                  <span className="ea-res-label">{label}</span>
                  <div className="ea-res-bar-bg">
                    <div
                      className="ea-res-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="ea-res-count">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="ea-res-note">
            <AlertTriangle size={12} />
            <span>4 escalations exceeded 14-day SLA threshold</span>
          </div>
        </div>
      </div>

      {/* ── Top Escalated Issues Table ── */}
      <div className="ea-card ea-card--table">
        <div className="ea-card-header">
          <div>
            <h2 className="ea-card-title">Top Escalated Issues</h2>
            <p className="ea-card-sub">Most critical open and recently escalated bugs</p>
          </div>
          <button className="ea-btn ea-btn-outline ea-btn-sm">View All</button>
        </div>
        <div className="ea-table-wrap">
          <table className="ea-table">
            <thead>
              <tr>
                <th>Bug ID</th>
                <th>Title</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Days Open</th>
                <th>SLA Status</th>
              </tr>
            </thead>
            <tbody>
              {TOP_ESCALATED.map((bug) => (
                <tr key={bug.id} className={bug.breached ? 'ea-row-breach' : ''}>
                  <td>
                    <span className="ea-bug-id">{bug.id}</span>
                  </td>
                  <td>
                    <span className="ea-bug-title">{bug.title}</span>
                  </td>
                  <td>
                    <span className="ea-dept-chip">{bug.dept}</span>
                  </td>
                  <td>
                    <PriorityBadge priority={bug.priority} />
                  </td>
                  <td>
                    <span className={`ea-days ${bug.daysOpen >= 7 ? 'ea-days-warn' : ''}`}>
                      {bug.daysOpen}d
                    </span>
                  </td>
                  <td>
                    {bug.breached
                      ? <span className="ea-sla-breach"><AlertTriangle size={12} />Breached</span>
                      : <span className="ea-sla-ok"><BarChart3 size={12} />On Track</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default EscalationAnalytics;