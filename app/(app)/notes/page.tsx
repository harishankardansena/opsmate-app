import { Suspense } from 'react';
'use client';
// app/(app)/notes/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Zap, Star, FileText, CheckSquare, AlignLeft, Bold, Italic, Download } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';

type NoteType = 'meeting' | 'daily_log' | 'discussion' | 'personal' | 'general';

interface Note {
  _id: string;
  title: string;
  content: string;
  type: NoteType;
  tags?: string[];
  aiSummary?: string;
  actionItems?: string[];
  isStarred?: boolean;
  updatedAt: string;
}

const TYPE_CONFIG: Record<NoteType, { label: string; color: string; icon: React.ReactNode }> = {
  meeting: { label: 'Meeting', color: 'var(--primary-light)', icon: <FileText size={14} /> },
  daily_log: { label: 'Daily Log', color: 'var(--info)', icon: <AlignLeft size={14} /> },
  discussion: { label: 'Discussion', color: 'var(--warning)', icon: <MessageSquareIcon /> },
  personal: { label: 'Personal', color: 'var(--accent)', icon: <Star size={14} /> },
  general: { label: 'General', color: 'var(--text-muted)', icon: <FileText size={14} /> },
};

function MessageSquareIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>; }

const EMPTY_FORM = { title: '', type: 'general' as NoteType, tags: '' };

function NotesPageContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<NoteType | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Note | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const { success, error } = useToast();
  const searchParams = useSearchParams();

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.set('type', filterType);
    if (search) params.set('search', search);
    const res = await fetch(`/api/notes?${params}`);
    const data = await res.json();
    setNotes(data.notes || []);
    setLoading(false);
  }, [filterType, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchParams.get('new') === 'true') { openNew(); }
  }, [searchParams]);

  const openNew = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    editor?.commands.setContent('');
    setShowModal(true);
  };

  const openEdit = (n: Note) => {
    setEditItem(n);
    setForm({ title: n.title, type: n.type, tags: (n.tags || []).join(', ') });
    editor?.commands.setContent(n.content);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title.trim()) return error('Title is required');
    const content = editor?.getHTML();
    if (!content || content === '<p></p>') return error('Content is required');
    
    setSaving(true);
    const body = { title: form.title, type: form.type, content, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean) };
    
    try {
      if (editItem) {
        const res = await fetch(`/api/notes/${editItem._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        setNotes((prev) => prev.map((n) => n._id === editItem._id ? data.note : n));
        success('Note updated!');
      } else {
        const res = await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        success('Note created!');
      }
      setShowModal(false);
    } catch { error('Failed to save note'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    setNotes((prev) => prev.filter((n) => n._id !== id));
    success('Deleted');
  };

  const toggleStar = async (n: Note) => {
    const res = await fetch(`/api/notes/${n._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isStarred: !n.isStarred }) });
    const data = await res.json();
    setNotes((prev) => prev.map((item) => item._id === n._id ? data.note : item));
  };

  const summarize = async (id: string, content: string, mode: 'summary' | 'action_items') => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, mode })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const updateBody = mode === 'summary' ? { aiSummary: data.text } : { actionItems: data.text.split('\n').filter(Boolean) };
      const patchRes = await fetch(`/api/notes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateBody) });
      const patchData = await patchRes.json();
      
      setNotes((prev) => prev.map((n) => n._id === id ? patchData.note : n));
      success('AI generated successfully!');
    } catch {
      error('AI failed to process');
    } finally {
      setAiLoading(false);
    }
  };

  const exportExcel = () => {
    if (notes.length === 0) return error('No notes to export');
    
    // Format data for Excel
    const data = notes.map(n => ({
      'Title': n.title,
      'Type': TYPE_CONFIG[n.type].label,
      'Content (HTML)': n.content,
      'Tags': (n.tags || []).join(', '),
      'Starred': n.isStarred ? 'Yes' : 'No',
      'AI Summary': n.aiSummary || '',
      'Action Items': (n.actionItems || []).join('\\n'),
      'Last Updated': new Date(n.updatedAt).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Notes');
    
    XLSX.writeFile(workbook, `notes_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="page-container animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notes & Meetings</h1>
          <p className="page-subtitle">Rich text editor with AI summaries and action item extraction.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={exportExcel} title="Export Notes to Excel">
            <Download size={16} /> Export Notes
          </button>
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={16} /> New Note
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={filterType} onChange={(e) => setFilterType(e.target.value as NoteType | '')}>
          <option value="">All Types</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="skeleton glass-card" style={{ height: 200 }} />)
        ) : notes.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <FileText size={32} color="var(--text-muted)" />
            <p>No notes found.</p>
          </div>
        ) : (
          notes.map((n) => (
            <div key={n._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2 items-center">
                  <button onClick={() => toggleStar(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: n.isStarred ? 'var(--warning)' : 'var(--text-muted)' }}>
                    <Star size={16} fill={n.isStarred ? 'var(--warning)' : 'none'} />
                  </button>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }} className="truncate">{n.title}</h3>
                </div>
                <div className="flex gap-1">
                  <button className="btn-icon-sm btn-ghost" onClick={() => openEdit(n)}><Edit2 size={14} /></button>
                  <button className="btn-icon-sm btn-ghost text-danger" onClick={() => remove(n._id)}><Trash2 size={14} /></button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="badge" style={{ background: `rgba(${TYPE_CONFIG[n.type].color.replace('var(', '').replace(')', '')}, 0.15)`, color: TYPE_CONFIG[n.type].color }}>
                  {TYPE_CONFIG[n.type].icon} {TYPE_CONFIG[n.type].label}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(n.updatedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="text-sm text-secondary mb-4" style={{ flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }} dangerouslySetInnerHTML={{ __html: n.content }} />

              {(n.aiSummary || n.actionItems?.length ? true : false) && (
                <div style={{ background: 'rgba(108,99,255,0.05)', border: '1px solid rgba(108,99,255,0.1)', borderRadius: 8, padding: '0.75rem', marginTop: 'auto', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                  <div className="flex items-center gap-1 text-primary-color font-semibold mb-1"><Zap size={12} /> AI Insights</div>
                  {n.aiSummary && <p className="text-secondary truncate">{n.aiSummary}</p>}
                  {n.actionItems && n.actionItems.length > 0 && <p className="text-secondary mt-1">{n.actionItems.length} action item(s)</p>}
                </div>
              )}

              <div className="flex gap-2 mt-auto pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button className="btn btn-sm btn-ghost flex-1" onClick={() => summarize(n._id, n.content, 'summary')} disabled={aiLoading}>
                  <Zap size={14} color="var(--primary-light)" /> Summarize
                </button>
                <button className="btn btn-sm btn-ghost flex-1" onClick={() => summarize(n._id, n.content, 'action_items')} disabled={aiLoading}>
                  <CheckSquare size={14} color="var(--accent)" /> Actions
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? 'Edit Note' : 'New Note'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ border: 'none' }}>✕</button>
            </div>
            
            <div className="form-group"><input className="form-input" style={{ fontSize: '1.25rem', fontWeight: 600, padding: '0.5rem 0', border: 'none', background: 'transparent', borderBottom: '1px solid var(--border)', borderRadius: 0 }} placeholder="Note Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoFocus /></div>
            
            <div className="flex gap-4 mb-4">
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label text-xs">Type</label>
                <select className="form-select" style={{ padding: '0.4rem 1rem' }} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as NoteType }))}>
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                <label className="form-label text-xs">Tags (comma-separated)</label>
                <input className="form-input" style={{ padding: '0.4rem 1rem' }} placeholder="design, frontend..." value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
              </div>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 300 }}>
              {editor && (
                <div style={{ padding: '0.5rem', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => editor.chain().focus().toggleBold().run()} className={`btn-icon-sm ${editor.isActive('bold') ? 'btn-primary' : 'btn-ghost'}`}><Bold size={14} /></button>
                  <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`btn-icon-sm ${editor.isActive('italic') ? 'btn-primary' : 'btn-ghost'}`}><Italic size={14} /></button>
                </div>
              )}
              <div style={{ padding: '1rem', flex: 1, overflowY: 'auto', background: 'var(--bg-glass)' }}>
                <EditorContent editor={editor} style={{ minHeight: '100%', outline: 'none' }} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Note'}</button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .ProseMirror { min-height: 250px; outline: none; cursor: text; color: var(--text-primary); }
        .ProseMirror:focus { outline: none; }
        .ProseMirror p { margin-bottom: 0.5rem; }
        .ProseMirror strong { font-weight: 700; color: var(--text-primary); }
      `}} />
    </div>
  );
}

export default function NotesPage() { return <Suspense fallback={<div>Loading...</div>}><NotesPageContent /></Suspense>; }
