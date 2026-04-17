import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import {
  ShieldCheck, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Clock, Users, Download, Calendar,
  ArrowUpRight, ArrowDownRight, Minus, Filter,
} from 'lucide-react';
import './executiveSummary.css';

/* ─────────────────────── MOCK DATA ─────────────────────── */

const complianceTrend = [
  { month: 'Aug', compliance: 91.2, target: 95 },
  { month: 'Sep', compliance: 88.5, target: 95 },
  { month: 'Oct', compliance: 93.1, target: 95 },
  { month: 'Nov', compliance: 90.4, target: 95 },
  { month: 'Dec', compliance: 87.8, target: 95 },
  { month: 'Jan', compliance: 94.6, target: 95 },
  { month: 'Feb', compliance: 96.2, target: 95 },
];

const departmentData = [
  { dept: 'Engineering', compliant: 142, breached: 12, rate: 92.2 },
  { dept: 'Support',     compliant: 208, breached: 8,  rate: 96.3 },
  { dept: 'Operations',  compliant: 95,  breached: 21, rate: 81.9 },
  { dept: 'Product',     compliant: 67,  breached: 5,  rate: 93.1 },
  { dept: 'QA',          compliant: 53,  breached: 3,  rate: 94.6 },
];

const statusDist = [
  { name: 'Resolved',    value: 412, color: '#16A34A' },
  { name: 'In Progress', value: 87,  color: '#2563EB' },
  { name: 'Escalated',   value: 34,  color: '#DC2626' },
  { name: 'Pending',     value: 28,  color: '#D97706' },
];

const responseTimeTrend = [
  { week: 'W1', avg: 4.2, p90: 7.1 },
  { week: 'W2', avg: 3.8, p90: 6.4 },
  { week: 'W3', avg: 5.1, p90: 8.9 },
  { week: 'W4', avg: 3.3, p90: 5.8 },
  { week: 'W5', avg: 2.9, p90: 4.7 },
  { week: 'W6', avg: 3.6, p90: 6.2 },
  { week: 'W7', avg: 2.4, p90: 4.1 },
  { week: 'W8', avg: 2.1, p90: 3.6 },
];

const topEscalations = [
  { id: 'BUG-1042', title: 'Payment gateway timeout on checkout',     dept: 'Engineering', age: '5d', severity: 'Critical', owner: 'J. Santos' },
  { id: 'BUG-1039', title: 'Dashboard fails to load for >500 records', dept: 'Engineering', age: '7d', severity: 'High',     owner: 'M. Reyes'  },
  { id: 'BUG-1055', title: 'Email notifications not sending',          dept: 'Support',     age: '3d', severity: 'High',     owner: 'A. Cruz'   },
  { id: 'BUG-1061', title: 'Report export corrupting Excel files',     dept: 'Operations',  age: '2d', severity: 'Medium',  owner: 'R. Lim'    },
  { id: 'BUG-1067', title: 'Mobile login loop on iOS 17',             dept: 'QA',          age: '1d', severity: 'High',     owner: 'C. Tan'    },
];

/* ─────────────────────── HELPERS ─────────────────────── */

const kpiCards = [
  {
    label:    'SLA Compliance Rate',
    value:    '96.2%',
    sub:      '+2.1% vs last month',
    trend:    'up',
    icon:     ShieldCheck,
    accent:   'green',
  },
  {
    label:    'Total Tickets',
    value:    '561',
    sub:      '+38 vs last month',
    trend:    'neutral',
    icon:     Clock,
    accent:   'blue',
  },
  {
    label:    'Resolved',
    value:    '412',
    sub:      '73.4% resolution rate',
    trend:    'up',
    icon:     CheckCircle2,
    accent:   'green',
  },
  {
    label:    'Escalated',
    value:    '34',
    sub:      '-6 vs last month',
    trend:    'up',
    icon:     AlertTriangle,
    accent:   'red',
  },
  {
    label:    'Avg Response Time',
    value:    '2.1 hrs',
    sub:      '-0.8 hrs vs last month',
    trend:    'up',
    icon:     TrendingUp,
    accent:   'green',
  },
  {
    label:    'SLA Breaches',
    value:    '49',
    sub:      '-11 vs last month',
    trend:    'up',
    icon:     Users,
    accent:   'orange',
  },
];

const TrendIcon = ({ trend }) => {
  if (trend === 'up')      return <ArrowUpRight size={14} className="trend-icon up" />;
  if (trend === 'down')    return <ArrowDownRight size={14} className="trend-icon down" />;
  return <Minus size={14} className="trend-icon neutral" />;
};

const SeverityBadge = ({ severity }) => (
  <span className={`severity-badge severity-${severity.toLowerCase()}`}>{severity}</span>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="tooltip-row">
          <span className="tooltip-name">{p.name}:</span>
          <span className="tooltip-value">{typeof p.value === 'number' && p.name.includes('%') ? p.value + '%' : p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ─────────────────────── COMPONENT ─────────────────────── */

const ExecutiveSummary = () => {
  const [dateRange, setDateRange] = useState('last30');
  const [activeIndex, setActiveIndex] = useState(null);

  const totalTickets = statusDist.reduce((s, d) => s + d.value, 0);

  return (
    <div className="es-page">

      {/* ── Page Header ── */}
      <div className="es-page-header">
        <div className="es-page-header-left">
          <div className="es-page-badge">
            <ShieldCheck size={13} />
            SLA Monitoring
          </div>
          <h1 className="es-page-title">Executive Summary</h1>
          <p className="es-page-subtitle">
            High-level overview of SLA performance, compliance trends, and escalation metrics.
          </p>
        </div>
        <div className="es-page-header-right">
          <div className="es-date-filter">
            <Calendar size={15} className="es-date-icon" />
            <select
              className="es-date-select"
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
            >
              <option value="last7">Last 7 days</option>
              <option value="last30">Last 30 days</option>
              <option value="last90">Last 90 days</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>
          <button className="es-export-btn">
            <Download size={15} />
            Export Report
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="es-kpi-grid">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`es-kpi-card accent-${card.accent}`} style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="es-kpi-top">
                <div className={`es-kpi-icon-wrap accent-${card.accent}`}>
                  <Icon size={18} />
                </div>
                <TrendIcon trend={card.trend} />
              </div>
              <div className="es-kpi-value">{card.value}</div>
              <div className="es-kpi-label">{card.label}</div>
              <div className="es-kpi-sub">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Row 1: Compliance Trend + Status Distribution ── */}
      <div className="es-row-2col">

        {/* Compliance Trend */}
        <div className="es-card es-card-wide">
          <div className="es-card-header">
            <div>
              <h3 className="es-card-title">SLA Compliance Trend</h3>
              <p className="es-card-desc">Monthly compliance rate vs. 95% target</p>
            </div>
            <div className="es-compliance-pill good">
              <CheckCircle2 size={12} /> On Track
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={complianceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="complianceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#DC2626" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => v + '%'} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area
                type="monotone"
                dataKey="compliance"
                name="Compliance %"
                stroke="#DC2626"
                strokeWidth={2.5}
                fill="url(#complianceGrad)"
                dot={{ r: 4, fill: '#DC2626', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Target (95%)"
                stroke="#9CA3AF"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="es-card">
          <div className="es-card-header">
            <div>
              <h3 className="es-card-title">Ticket Status</h3>
              <p className="es-card-desc">Current distribution of {totalTickets} tickets</p>
            </div>
          </div>
          <div className="es-donut-wrap">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {statusDist.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} tickets`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="es-donut-center">
              <span className="es-donut-total">{totalTickets}</span>
              <span className="es-donut-label">Total</span>
            </div>
          </div>
          <div className="es-legend-list">
            {statusDist.map((item, i) => (
              <div key={i} className="es-legend-item">
                <span className="es-legend-dot" style={{ background: item.color }} />
                <span className="es-legend-name">{item.name}</span>
                <span className="es-legend-count">{item.value}</span>
                <span className="es-legend-pct">{((item.value / totalTickets) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Department Performance + Response Time ── */}
      <div className="es-row-2col">

        {/* Department Performance */}
        <div className="es-card es-card-wide">
          <div className="es-card-header">
            <div>
              <h3 className="es-card-title">Department SLA Performance</h3>
              <p className="es-card-desc">Compliant vs. breached tickets per department</p>
            </div>
            <button className="es-filter-btn"><Filter size={13} /> Filter</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="compliant" name="Compliant" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="breached"  name="Breached"  fill="#DC2626" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
          <div className="es-dept-rate-row">
            {departmentData.map((d, i) => (
              <div key={i} className="es-dept-rate-item">
                <span className="es-dept-name">{d.dept}</span>
                <div className="es-dept-bar-bg">
                  <div
                    className="es-dept-bar-fill"
                    style={{ width: d.rate + '%', background: d.rate >= 90 ? '#16A34A' : d.rate >= 85 ? '#D97706' : '#DC2626' }}
                  />
                </div>
                <span className="es-dept-rate-val">{d.rate}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Response Time */}
        <div className="es-card">
          <div className="es-card-header">
            <div>
              <h3 className="es-card-title">Response Time Trends</h3>
              <p className="es-card-desc">Avg & P90 response time (hrs) — last 8 weeks</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={responseTimeTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => v + 'h'} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Line type="monotone" dataKey="avg" name="Avg (hrs)" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="p90" name="P90 (hrs)" stroke="#D97706" strokeWidth={2} strokeDasharray="4 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="es-rt-summary">
            <div className="es-rt-stat">
              <span className="es-rt-val blue">2.1h</span>
              <span className="es-rt-lbl">Current Avg</span>
            </div>
            <div className="es-rt-divider" />
            <div className="es-rt-stat">
              <span className="es-rt-val orange">3.6h</span>
              <span className="es-rt-lbl">Current P90</span>
            </div>
            <div className="es-rt-divider" />
            <div className="es-rt-stat">
              <span className="es-rt-val green">↓ 50%</span>
              <span className="es-rt-lbl">8-Week Δ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Escalations Table ── */}
      <div className="es-card es-card-full">
        <div className="es-card-header">
          <div>
            <h3 className="es-card-title">Active Escalations</h3>
            <p className="es-card-desc">Tickets currently breaching SLA — requires immediate attention</p>
          </div>
          <span className="es-escalation-count">{topEscalations.length} open</span>
        </div>
        <div className="es-table-wrap">
          <table className="es-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Issue</th>
                <th>Department</th>
                <th>Owner</th>
                <th>Age</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {topEscalations.map((row, i) => (
                <tr key={i} className="es-table-row">
                  <td><span className="es-ticket-id">{row.id}</span></td>
                  <td><span className="es-ticket-title">{row.title}</span></td>
                  <td><span className="es-dept-tag">{row.dept}</span></td>
                  <td><span className="es-owner">{row.owner}</span></td>
                  <td><span className="es-age">{row.age}</span></td>
                  <td><SeverityBadge severity={row.severity} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ExecutiveSummary;