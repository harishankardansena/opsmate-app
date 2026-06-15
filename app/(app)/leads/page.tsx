import { Suspense } from 'react';
'use client';
// app/(app)/leads/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Phone, Mail, MessageCircle, Search, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useSearchParams } from 'next/navigation';

type LeadStatus = 'new' | 'contacted' | 'follow_up' | 'interested' | 'converted' | 'lost';
type LeadSource = 'website' | 'referral' | 'cold_call' | 'social_media' | 'email' | 'walk_in' | 'other';

interface Lead {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  designation?: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  value?: number;
  createdAt: string;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  contacted: { label: 'Contacted', color: 'var(--info)', bg: 'rgba(59,130,246,0.15)' },
  follow_up: { label: 'Follow Up', color: 'var(--warning)', bg: 'rgba(245,158,11,0.15)' },
  interested: { label: 'Interested', color: 'var(--accent)', bg: 'rgba(0,212,170,0.15)' },
  converted: { label: 'Converted', color: 'var(--success)', bg: 'rgba(16,185,129,0.15)' },
  lost: { label: 'Lost', color: 'var(--danger)', bg: 'rgba(239,68,68,0.15)' },
};

const PIPELINE: LeadStatus[] = ['new', 'contacted', 'follow_up', 'interested', 'converted', 'lost'];
const EMPTY_FORM = { name: '', phone: '', email: '', company: '', designation: '', source: 'cold_call' as LeadSource, status: 'new' as LeadStatus, notes: '', value: '' };

function LeadsPageContent() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();
  const searchParams = useSearchParams();

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (search) params.set('search', search);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setLoading(false);
  }, [filterStatus, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchParams.get('new') === 'true') { setEditLead(null); setForm(EMPTY_FORM); setShowModal(true); }
  }, [searchParams]);

  const openEdit = (l: Lead) => {
    setEditLead(l);
    setForm({ name: l.name, phone: l.phone, email: l.email || '', company: l.company || '', designation: l.designation || '', source: l.source, status: l.status, notes: l.notes || '', value: String(l.value || '') });
    setShowModal(true);
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name || !form.phone) return error('Name and phone are required');
    setSaving(true);
    const body = { ...form, value: form.value ? Number(form.value) : undefined };
    try {
      if (editLead) {
        const res = await fetch(`/api/leads/${editLead._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        setLeads((prev) => prev.map((l) => l._id === editLead._id ? data.lead : l));
        success('Lead updated!');
      } else {
        const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        setLeads((prev) => [data.lead, ...prev]);
        success('Lead added!');
      }
      setShowModal(false);
    } catch { error('Failed to save lead'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    setLeads((prev) => prev.filter((l) => l._id !== id));
    success('Lead deleted');
  };

  const updateStatus = async (id: string, status: LeadStatus) => {
    const res = await fetch(`/api/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    const data = await res.json();
    setLeads((prev) => prev.map((l) => l._id === id ? data.lead : l));
    success('Status updated');
  };

  // Pipeline funnel stats
  const pipelineStats = PIPELINE.map((s) => ({ status: s, count: leads.filter((l) => l.status === s).length }));

  return (
    <div className="page-container animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lead Management</h1>
          <p className="page-subtitle">{leads.length} leads · {leads.filter((l) => l.status === 'converted').length} converted</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditLead(null); setForm(EMPTY_FORM); setShowModal(true); }} id="new-lead-btn">
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* Pipeline Funnel */}
      <div className="glass-card mb-6">
        <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lead Pipeline</h3>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {pipelineStats.map((p, i) => (
            <div key={p.status} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                onClick={() => setFilterStatus(filterStatus === p.status ? '' : p.status)}
                style={{
                  background: filterStatus === p.status ? STATUS_CONFIG[p.status].bg : 'var(--bg-glass)',
                  border: `1px solid ${filterStatus === p.status ? STATUS_CONFIG[p.status].color : 'var(--border)'}`,
                  borderRadius: 8, padding: '0.5rem 0.875rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: STATUS_CONFIG[p.status].color, fontSize: '0.875rem', fontWeight: 600 }}>{p.count}</span>
                <span style={{ color: STATUS_CONFIG[p.status].color, fontSize: '0.8125rem' }}>{STATUS_CONFIG[p.status].label}</span>
              </button>
              {i < pipelineStats.length - 1 && <ChevronRight size={14} color="var(--text-muted)" />}
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-4">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            id="leads-search"
            className="form-input"
            placeholder="Search leads by name, phone, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <select className="form-select" style={{ width: 160 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as LeadStatus | '')} id="leads-filter">
          <option value="">All Status</option>
          {PIPELINE.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Source</th>
              <th>Status</th>
              <th>Value</th>
              <th>Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="flex flex-col gap-2" style={{ padding: '1rem' }}>{[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 40 }} />)}</div></td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No leads found. <button className="btn btn-ghost btn-sm" onClick={() => { setEditLead(null); setForm(EMPTY_FORM); setShowModal(true); }}>Add your first lead →</button></td></tr>
            ) : leads.map((lead) => (
              <tr key={lead._id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{lead.name}</div>
                  {lead.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.email}</div>}
                </td>
                <td>
                  <div className="flex gap-1">
                    <a href={`tel:${lead.phone}`} className="btn-icon-sm" style={{ color: 'var(--success)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, padding: '0.25rem', display: 'inline-flex' }} title="Call">
                      <Phone size={13} />
                    </a>
                    <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn-icon-sm" style={{ color: '#25D366', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 6, padding: '0.25rem', display: 'inline-flex' }} title="WhatsApp">
                      <MessageCircle size={13} />
                    </a>
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="btn-icon-sm" style={{ color: 'var(--info)', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, padding: '0.25rem', display: 'inline-flex' }} title="Email">
                        <Mail size={13} />
                      </a>
                    )}
                    <span style={{ fontSize: '0.8125rem', marginLeft: '0.25rem' }}>{lead.phone}</span>
                  </div>
                </td>
                <td>{lead.company || <span className="text-muted">—</span>}</td>
                <td><span style={{ fontSize: '0.8125rem', textTransform: 'capitalize' }}>{lead.source.replace('_', ' ')}</span></td>
                <td>
                  <select
                    value={lead.status}
                    onChange={(e) => updateStatus(lead._id, e.target.value as LeadStatus)}
                    style={{ background: STATUS_CONFIG[lead.status].bg, color: STATUS_CONFIG[lead.status].color, border: `1px solid ${STATUS_CONFIG[lead.status].color}40`, borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {PIPELINE.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                </td>
                <td>{lead.value ? <span style={{ color: 'var(--success)' }}>₹{lead.value.toLocaleString()}</span> : <span className="text-muted">—</span>}</td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-icon-sm" onClick={() => openEdit(lead)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0.25rem', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                      <Edit2 size={13} />
                    </button>
                    <button className="btn-icon-sm" onClick={() => remove(lead._id)} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '0.25rem', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editLead ? 'Edit Lead' : 'Add Lead'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Name *</label><input id="lead-name" className="form-input" placeholder="Full name" value={form.name} onChange={set('name')} autoFocus /></div>
              <div className="form-group"><label className="form-label">Phone *</label><input id="lead-phone" className="form-input" placeholder="+91 99999 88888" value={form.phone} onChange={set('phone')} /></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Email</label><input id="lead-email" type="email" className="form-input" placeholder="email@company.com" value={form.email} onChange={set('email')} /></div>
              <div className="form-group"><label className="form-label">Company</label><input id="lead-company" className="form-input" placeholder="Company name" value={form.company} onChange={set('company')} /></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Designation</label><input id="lead-desig" className="form-input" placeholder="CEO, Manager..." value={form.designation} onChange={set('designation')} /></div>
              <div className="form-group"><label className="form-label">Deal Value (₹)</label><input id="lead-value" type="number" className="form-input" placeholder="50000" value={form.value} onChange={set('value')} /></div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Source</label>
                <select id="lead-source" className="form-select" value={form.source} onChange={set('source')}>
                  {(['website', 'referral', 'cold_call', 'social_media', 'email', 'walk_in', 'other'] as LeadSource[]).map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select id="lead-status" className="form-select" value={form.status} onChange={set('status')}>
                  {PIPELINE.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Notes</label><textarea id="lead-notes" className="form-textarea" placeholder="Any relevant notes..." value={form.notes} onChange={set('notes')} /></div>
            <div className="flex gap-2 justify-between">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button id="lead-save-btn" className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Saving...</> : editLead ? 'Update Lead' : 'Add Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() { return <Suspense fallback={<div>Loading...</div>}><LeadsPageContent /></Suspense>; }
