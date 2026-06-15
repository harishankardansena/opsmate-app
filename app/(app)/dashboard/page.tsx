'use client';
// app/(app)/dashboard/page.tsx
import { useEffect, useState } from 'react';
import {
  CheckSquare, Users, Bell, TrendingUp, Phone, Target, AlertCircle, Calendar,
  Plus, ArrowRight, Activity,
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  stats: {
    tasksDueToday: number;
    pendingTasks: number;
    inProgressTasks: number;
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    overdueFollowups: number;
    todayFollowups: number;
    callsToday: number;
    meetingsToday: number;
    salesToday: number;
  };
  recentTasks: Array<{ _id: string; title: string; status: string; priority: string; dueDate?: string }>;
  upcomingFollowups: Array<{ _id: string; contactName: string; type: string; scheduledAt: string }>;
  weekPerformance: Array<{ date: string; calls: number; meetings: number; sales: number; conversions: number }>;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'var(--danger)', high: 'var(--warning)', medium: 'var(--info)', low: 'var(--text-muted)',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Pending', in_progress: '🔄 In Progress', completed: '✅ Done', cancelled: '❌ Cancelled',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const chartData = (data?.weekPerformance ?? []).map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-IN', { weekday: 'short' }),
    calls: p.calls,
    meetings: p.meetings,
    sales: p.sales,
  }));

  const stats = data?.stats;

  return (
    <div className="page-container animate-fade">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/tasks?new=true" className="btn btn-primary" id="dashboard-new-task">
            <Plus size={16} /> New Task
          </Link>
          <Link href="/leads?new=true" className="btn btn-accent" id="dashboard-new-lead">
            <Plus size={16} /> New Lead
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard
          icon={<CheckSquare size={22} />}
          iconBg="rgba(108,99,255,0.2)"
          iconColor="var(--primary-light)"
          gradient="linear-gradient(135deg, var(--primary), var(--primary-dark))"
          label="Tasks Due Today"
          value={loading ? '—' : String(stats?.tasksDueToday ?? 0)}
          sub={`${stats?.pendingTasks ?? 0} pending · ${stats?.inProgressTasks ?? 0} in progress`}
        />
        <StatCard
          icon={<Users size={22} />}
          iconBg="rgba(0,212,170,0.2)"
          iconColor="var(--accent)"
          gradient="linear-gradient(135deg, var(--accent), var(--accent-dark))"
          label="Total Leads"
          value={loading ? '—' : String(stats?.totalLeads ?? 0)}
          sub={`${stats?.convertedLeads ?? 0} converted · ${stats?.conversionRate ?? 0}% rate`}
        />
        <StatCard
          icon={<Bell size={22} />}
          iconBg="rgba(245,158,11,0.2)"
          iconColor="var(--warning)"
          gradient="linear-gradient(135deg, var(--warning), #D97706)"
          label="Follow-ups Today"
          value={loading ? '—' : String(stats?.todayFollowups ?? 0)}
          sub={stats?.overdueFollowups ? `⚠️ ${stats.overdueFollowups} overdue` : 'All on track'}
          danger={!!stats?.overdueFollowups}
        />
        <StatCard
          icon={<Phone size={22} />}
          iconBg="rgba(59,130,246,0.2)"
          iconColor="var(--info)"
          gradient="linear-gradient(135deg, var(--info), #2563EB)"
          label="Calls Today"
          value={loading ? '—' : String(stats?.callsToday ?? 0)}
          sub={`${stats?.meetingsToday ?? 0} meetings · ${stats?.salesToday ?? 0} sales`}
        />
        <StatCard
          icon={<Target size={22} />}
          iconBg="rgba(16,185,129,0.2)"
          iconColor="var(--success)"
          gradient="linear-gradient(135deg, var(--success), #059669)"
          label="Conversion Rate"
          value={loading ? '—' : `${stats?.conversionRate ?? 0}%`}
          sub={`${stats?.convertedLeads ?? 0} of ${stats?.totalLeads ?? 0} leads`}
        />
      </div>

      {/* Charts + Lists */}
      <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Performance Chart */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--accent)" /> Weekly Activity
            </h3>
            <Link href="/performance" className="btn btn-ghost btn-sm">View All <ArrowRight size={14} /></Link>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                />
                <Line type="monotone" dataKey="calls" stroke="var(--primary-light)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="meetings" stroke="var(--accent)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="sales" stroke="var(--success)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <Activity size={32} color="var(--text-muted)" />
              <p className="text-sm text-muted">No performance data yet.</p>
              <Link href="/performance" className="btn btn-ghost btn-sm">Log today&apos;s data →</Link>
            </div>
          )}
          <div className="flex gap-4 mt-2" style={{ fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--primary-light)' }}>● Calls</span>
            <span style={{ color: 'var(--accent)' }}>● Meetings</span>
            <span style={{ color: 'var(--success)' }}>● Sales</span>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckSquare size={18} color="var(--primary-light)" /> Pending Tasks
            </h3>
            <Link href="/tasks" className="btn btn-ghost btn-sm">View All <ArrowRight size={14} /></Link>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8 }} />
              ))}
            </div>
          ) : data?.recentTasks.length ? (
            <div className="flex flex-col gap-2">
              {data.recentTasks.map((task) => (
                <div key={task._id} className="flex items-center gap-3" style={{ padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }} className="truncate">{task.title}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{STATUS_LABELS[task.status]}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <CheckSquare size={28} color="var(--text-muted)" />
              <p className="text-sm text-muted">All tasks done! 🎉</p>
              <Link href="/tasks?new=true" className="btn btn-ghost btn-sm">Create a task →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Follow-ups */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--warning)" /> Upcoming Follow-ups
          </h3>
          <Link href="/followups" className="btn btn-ghost btn-sm">View All <ArrowRight size={14} /></Link>
        </div>
        {loading ? (
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, flex: 1, borderRadius: 8 }} />)}
          </div>
        ) : data?.upcomingFollowups.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {data.upcomingFollowups.map((f) => (
              <div key={f._id} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.875rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{f.contactName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', textTransform: 'capitalize' }}>📞 {f.type}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                  {new Date(f.scheduledAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '1.5rem' }}>
            <Bell size={28} color="var(--text-muted)" />
            <p className="text-sm text-muted">No upcoming follow-ups.</p>
            <Link href="/followups?new=true" className="btn btn-ghost btn-sm">Schedule one →</Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.875rem', fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          Quick Actions
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
          {[
            { href: '/tasks?new=true', label: '+ New Task', color: 'var(--primary)' },
            { href: '/leads?new=true', label: '+ Add Lead', color: 'var(--accent)' },
            { href: '/followups?new=true', label: '+ Follow-up', color: 'var(--warning)' },
            { href: '/notes?new=true', label: '+ Meeting Note', color: 'var(--info)' },
            { href: '/performance', label: '📊 Log Today', color: 'var(--success)' },
            { href: '/ai-chat', label: '🤖 Ask AI', color: 'var(--primary-light)' },
            { href: '/incentives', label: '💰 Incentive', color: '#F59E0B' },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="btn btn-ghost btn-sm"
              style={{ borderColor: 'var(--border)', color: a.color }}
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, iconColor, gradient, label, value, sub, danger }: {
  icon: React.ReactNode; iconBg: string; iconColor: string; gradient: string;
  label: string; value: string; sub?: string; danger?: boolean;
}) {
  return (
    <div className="stat-card" style={{ '--gradient': gradient } as React.CSSProperties}>
      <div className="stat-card-icon" style={{ background: iconBg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div className="stat-card-value animate-count">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && (
        <div className="stat-card-change" style={{ color: danger ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 400 }}>
          {danger && <AlertCircle size={12} />}
          {sub}
        </div>
      )}
    </div>
  );
}
