'use client';
// app/(app)/followups/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Calendar, Clock, CheckCircle, XCircle, Phone, Mail, MessageCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useSearchParams } from 'next/navigation';

type FollowUpType = 'call' | 'email' | 'whatsapp' | 'meeting' | 'visit';
type FollowUpStatus = 'pending' | 'done' | 'missed' | 'rescheduled';

interface FollowUp {
  _id: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  type: FollowUpType;
  status: FollowUpStatus;
  scheduledAt: string;
  notes?: string;
}

const TYPE_ICONS: Record<FollowUpType, { icon: React.ReactNode; color: string; bg: string }> = {
  call: { icon: <Phone size={14} />, color: 'var(--info)', bg: 'rgba(59,130,246,0.15)' },
  email: { icon: <Mail size={14} />, color: 'var(--accent)', bg: 'rgba(0,212,170,0.15)' },
  whatsapp: { icon: <MessageCircle size={14} />, color: '#25D366', bg: 'rgba(37,211,102,0.15)' },
  meeting: { icon: <Calendar size={14} />, color: 'var(--primary-light)', bg: 'rgba(108,99,255,0.15)' },
  visit: { icon: <Clock size={14} />, color: 'var(--warning)', bg: 'rgba(245,158,11,0.15)' },
};

const STATUS_CONFIG: Record<FollowUpStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'var(--warning)', icon: <Clock size={14} /> },
  done: { label: 'Done', color: 'var(--success)', icon: <CheckCircle size={14} /> },
  missed: { label: 'Missed', color: 'var(--danger)', icon: <XCircle size={14} /> },
  rescheduled: { label: 'Rescheduled', color: 'var(--info)', icon: <Calendar size={14} /> },
};

const EMPTY_FORM = { contactName: '', contactPhone: '', contactEmail: '', type: 'call' as FollowUpType, status: 'pending' as FollowUpStatus, scheduledAtDate: '', scheduledAtTime: '', notes: '' };

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'overdue'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<FollowUp | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();
  const searchParams = useSearchParams();

  const load = useCallback(async () => {
    setLoading(true);
    let url = '/api/followups';
    if (filterMode === 'overdue') url += '?overdue=true';
    const res = await fetch(url);
    const data = await res.json();
    let items = data.followups || [];
    
    if (filterMode === 'today') {
      const today = new Date().toISOString().split('T')[0];
      items = items.filter((f: FollowUp) => f.scheduledAt.startsWith(today));
    }
    
    setFollowups(items);
    setLoading(false);
  }, [filterMode]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchParams.get('new') === 'true') { openNew(); }
  }, [searchParams]);

  const openNew = () => {
    setEditItem(null);
    const now = new Date();
    setForm({ ...EMPTY_FORM, scheduledAtDate: now.toISOString().split('T')[0], scheduledAtTime: now.toTimeString().slice(0, 5) });
    setShowModal(true);
  };

  const openEdit = (f: FollowUp) => {
    setEditItem(f);
    const d = new Date(f.scheduledAt);
    setForm({ contactName: f.contactName, contactPhone: f.contactPhone || '', contactEmail: f.contactEmail || '', type: f.type, status: f.status, scheduledAtDate: d.toISOString().split('T')[0], scheduledAtTime: d.toTimeString().slice(0, 5), notes: f.notes || '' });
    setShowModal(true);
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.contactName || !form.scheduledAtDate || !form.scheduledAtTime) return error('Name and date/time are required');
    setSaving(true);
    const scheduledAt = new Date(`${form.scheduledAtDate}T${form.scheduledAtTime}`).toISOString();
    const body = { contactName: form.contactName, contactPhone: form.contactPhone, contactEmail: form.contactEmail, type: form.type, status: form.status, scheduledAt, notes: form.notes };
    
    try {
      if (editItem) {
        const res = await fetch(`/api/followups/${editItem._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        setFollowups((prev) => prev.map((f) => f._id === editItem._id ? data.followup : f));
        success('Follow-up updated!');
      } else {
        const res = await fetch('/api/followups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        setFollowups((prev) => [data.followup, ...prev].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));
        success('Follow-up scheduled!');
      }
      setShowModal(false);
    } catch { error('Failed to save'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this follow-up?')) return;
    await fetch(`/api/followups/${id}`, { method: 'DELETE' });
    setFollowups((prev) => prev.filter((f) => f._id !== id));
    success('Deleted');
  };

  const markDone = async (id: string) => {
    const res = await fetch(`/api/followups/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'done' }) });
    const data = await res.json();
    setFollowups((prev) => prev.map((f) => f._id === id ? data.followup : f));
    success('Marked as done');
  };

  return (
    <div className="page-container animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Follow-ups</h1>
          <p className="page-subtitle">Never miss a callback or meeting.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Schedule
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button className={`btn btn-sm ${filterMode === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterMode('all')}>All</button>
        <button className={`btn btn-sm ${filterMode === 'today' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterMode('today')}>Today</button>
        <button className={`btn btn-sm ${filterMode === 'overdue' ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setFilterMode('overdue')}>Overdue</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="skeleton glass-card" style={{ height: 160 }} />)
        ) : followups.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <Calendar size={32} color="var(--text-muted)" />
            <p>No follow-ups found.</p>
          </div>
        ) : (
          followups.map((f) => {
            const isOverdue = f.status === 'pending' && new Date(f.scheduledAt) < new Date();
            return (
              <div key={f._id} className={`glass-card ${isOverdue ? 'border-danger' : ''}`} style={isOverdue ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: TYPE_ICONS[f.type].bg, color: TYPE_ICONS[f.type].color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {TYPE_ICONS[f.type].icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{f.contactName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.contactPhone || f.contactEmail || 'No contact info'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <div className="flex items-center gap-1" style={{ fontSize: '0.75rem', color: STATUS_CONFIG[f.status].color }}>
                      {STATUS_CONFIG[f.status].icon} {STATUS_CONFIG[f.status].label}
                    </div>
                    {isOverdue && <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Overdue</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={14} />
                  {new Date(f.scheduledAt).toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>

                {f.notes && <div className="mb-4 text-sm text-muted truncate">{f.notes}</div>}

                <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex gap-2">
                    {f.type === 'call' && f.contactPhone && <a href={`tel:${f.contactPhone}`} className="btn-icon-sm btn-ghost"><Phone size={14} /></a>}
                    {f.type === 'whatsapp' && f.contactPhone && <a href={`https://wa.me/${f.contactPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn-icon-sm btn-ghost"><MessageCircle size={14} /></a>}
                    {f.type === 'email' && f.contactEmail && <a href={`mailto:${f.contactEmail}`} className="btn-icon-sm btn-ghost"><Mail size={14} /></a>}
                  </div>
                  <div className="flex gap-2">
                    {f.status === 'pending' && (
                      <button className="btn btn-sm btn-ghost text-success" onClick={() => markDone(f._id)}>
                        <CheckCircle size={14} /> Done
                      </button>
                    )}
                    <button className="btn-icon-sm btn-ghost" onClick={() => openEdit(f)}><Edit2 size={14} /></button>
                    <button className="btn-icon-sm btn-ghost text-danger" onClick={() => remove(f._id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? 'Edit Follow-up' : 'Schedule Follow-up'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ border: 'none' }}><XCircle size={20} /></button>
            </div>
            
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Contact Name *</label><input className="form-input" value={form.contactName} onChange={set('contactName')} autoFocus /></div>
              <div className="form-group"><label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={set('type')}>
                  {Object.keys(TYPE_ICONS).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.contactPhone} onChange={set('contactPhone')} /></div>
              <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={form.contactEmail} onChange={set('contactEmail')} /></div>
            </div>

            <div className="grid-2">
              <div className="form-group"><label className="form-label">Date *</label><input type="date" className="form-input" value={form.scheduledAtDate} onChange={set('scheduledAtDate')} /></div>
              <div className="form-group"><label className="form-label">Time *</label><input type="time" className="form-input" value={form.scheduledAtTime} onChange={set('scheduledAtTime')} /></div>
            </div>

            <div className="grid-2">
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={set('status')}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={set('notes')} /></div>

            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
