'use client';
// app/(app)/performance/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { Activity, Phone, Calendar as CalendarIcon, Target, TrendingUp, Save } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PerformanceRecord {
  _id: string;
  date: string;
  calls: number;
  meetings: number;
  sales: number;
  conversions: number;
}

export default function PerformancePage() {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  const [todayForm, setTodayForm] = useState({ calls: '', meetings: '', sales: '', conversions: '' });
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/performance?period=${period}`);
    const data = await res.json();
    setRecords(data.records || []);
    
    // Auto-fill today's data if exists
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = (data.records || []).find((r: any) => r.date.startsWith(todayStr));
    if (todayRecord) {
      setTodayForm({
        calls: String(todayRecord.calls),
        meetings: String(todayRecord.meetings),
        sales: String(todayRecord.sales),
        conversions: String(todayRecord.conversions),
      });
    }
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const saveToday = async () => {
    setSaving(true);
    const body = {
      date: new Date().toISOString(),
      calls: Number(todayForm.calls) || 0,
      meetings: Number(todayForm.meetings) || 0,
      sales: Number(todayForm.sales) || 0,
      conversions: Number(todayForm.conversions) || 0,
    };
    try {
      const res = await fetch('/api/performance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error();
      success("Today's performance logged successfully!");
      load();
    } catch {
      error('Failed to log performance');
    } finally {
      setSaving(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setTodayForm((f) => ({ ...f, [k]: e.target.value }));

  const chartData = records.map((r) => ({
    date: new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    calls: r.calls,
    meetings: r.meetings,
    sales: r.sales,
    conversions: r.conversions
  }));

  const totalCalls = records.reduce((sum, r) => sum + r.calls, 0);
  const totalMeetings = records.reduce((sum, r) => sum + r.meetings, 0);
  const totalSales = records.reduce((sum, r) => sum + r.sales, 0);
  const conversionRate = totalCalls > 0 ? Math.round((totalSales / totalCalls) * 100) : 0;

  return (
    <div className="page-container animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance Analytics</h1>
          <p className="page-subtitle">Track your daily efforts and sales outcomes.</p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Daily Input Form */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--primary-light)" /> Log Today's Activity
          </h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label text-info flex items-center gap-1"><Phone size={14} /> Calls Made</label>
              <input type="number" className="form-input" value={todayForm.calls} onChange={set('calls')} placeholder="e.g. 45" />
            </div>
            <div className="form-group">
              <label className="form-label text-accent flex items-center gap-1"><CalendarIcon size={14} /> Meetings Held</label>
              <input type="number" className="form-input" value={todayForm.meetings} onChange={set('meetings')} placeholder="e.g. 5" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group mb-0">
              <label className="form-label text-warning flex items-center gap-1"><Target size={14} /> Conversions / Leads</label>
              <input type="number" className="form-input" value={todayForm.conversions} onChange={set('conversions')} placeholder="e.g. 10" />
            </div>
            <div className="form-group mb-0">
              <label className="form-label text-success flex items-center gap-1"><TrendingUp size={14} /> Closed Sales</label>
              <input type="number" className="form-input" value={todayForm.sales} onChange={set('sales')} placeholder="e.g. 2" />
            </div>
          </div>
          <button className="btn btn-primary w-full mt-4" onClick={saveToday} disabled={saving}>
            {saving ? <div className="spinner" style={{ borderTopColor: '#fff' }} /> : <><Save size={16} /> Save Data</>}
          </button>
        </div>

        {/* High Level Stats */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Period Summary</h3>
            <select className="form-select" style={{ width: 'auto', padding: '0.3rem 1.5rem 0.3rem 0.75rem', fontSize: '0.8rem' }} value={period} onChange={(e) => setPeriod(e.target.value as any)}>
              <option value="daily">Last 7 Days</option>
              <option value="weekly">Last 30 Days</option>
              <option value="monthly">Last 6 Months</option>
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(59,130,246,0.1)', padding: '1rem', borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--info)', fontWeight: 600, marginBottom: '0.25rem' }}>Total Calls</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalCalls}</div>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '1rem', borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, marginBottom: '0.25rem' }}>Total Sales</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalSales}</div>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.1)', padding: '1rem', borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600, marginBottom: '0.25rem' }}>Meetings</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalMeetings}</div>
            </div>
            <div style={{ background: 'rgba(108,99,255,0.1)', padding: '1rem', borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600, marginBottom: '0.25rem' }}>Close Rate</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{conversionRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="glass-card mb-6">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Effort vs Results Trends</h3>
        {loading ? (
          <div className="skeleton" style={{ height: 300, width: '100%', borderRadius: 8 }} />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                itemStyle={{ fontSize: 13 }}
                labelStyle={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}
              />
              <Legend wrapperStyle={{ paddingTop: 20 }} />
              <Line type="monotone" dataKey="calls" name="Calls" stroke="var(--info)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="meetings" name="Meetings" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
              <Line type="monotone" dataKey="sales" name="Sales" stroke="var(--success)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <Activity size={32} color="var(--text-muted)" />
            <p>No data recorded for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
}
