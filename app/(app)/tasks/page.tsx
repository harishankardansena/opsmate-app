'use client';
// app/(app)/tasks/page.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit2, Trash2, Clock, AlertCircle, CheckCircle, XCircle, RefreshCw, Download, Upload } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';

type Status = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  dueDate?: string;
  dueTime?: string;
  tags?: string[];
}

const COLUMNS: { key: Status; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'pending', label: 'Pending', icon: <Clock size={16} />, color: 'var(--text-muted)' },
  { key: 'in_progress', label: 'In Progress', icon: <RefreshCw size={16} />, color: 'var(--info)' },
  { key: 'completed', label: 'Completed', icon: <CheckCircle size={16} />, color: 'var(--success)' },
  { key: 'cancelled', label: 'Cancelled', icon: <XCircle size={16} />, color: 'var(--danger)' },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'var(--text-muted)' },
  medium: { label: 'Medium', color: 'var(--info)' },
  high: { label: 'High', color: 'var(--warning)' },
  urgent: { label: 'Urgent', color: 'var(--danger)' },
};

const EMPTY_FORM = { title: '', description: '', status: 'pending' as Status, priority: 'medium' as Priority, dueDate: '', dueTime: '', tags: '' };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/tasks');
    const data = await res.json();
    setTasks(data.tasks || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setEditTask(null);
      setForm(EMPTY_FORM);
      setShowModal(true);
    }
  }, [searchParams]);

  const openNew = () => { setEditTask(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (t: Task) => {
    setEditTask(t);
    setForm({ title: t.title, description: t.description || '', status: t.status, priority: t.priority, dueDate: t.dueDate ? t.dueDate.split('T')[0] : '', dueTime: t.dueTime || '', tags: (t.tags || []).join(', ') });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title.trim()) return error('Title is required');
    setSaving(true);
    const body = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean), dueDate: form.dueDate || undefined };
    try {
      if (editTask) {
        const res = await fetch(`/api/tasks/${editTask._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        setTasks((prev) => prev.map((t) => t._id === editTask._id ? data.task : t));
        success('Task updated!');
      } else {
        const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        setTasks((prev) => [data.task, ...prev]);
        success('Task created!');
      }
      setShowModal(false);
    } catch { error('Failed to save task'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setTasks((prev) => prev.filter((t) => t._id !== id));
    success('Task deleted');
  };

  const moveTask = async (id: string, status: Status) => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    const data = await res.json();
    setTasks((prev) => prev.map((t) => t._id === id ? data.task : t));
  };

  const tasksByStatus = (status: Status) => tasks.filter((t) => t.status === status);

  const exportExcel = () => {
    if (tasks.length === 0) return error('No tasks to export');
    
    // Format data for Excel
    const data = tasks.map(t => ({
      'Title': t.title,
      'Description': t.description || '',
      'Status': t.status,
      'Priority': t.priority,
      'Due Date': t.dueDate ? t.dueDate.split('T')[0] : '',
      'Due Time': t.dueTime || '',
      'Tags': (t.tags || []).join(', ')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
    
    // Save as .xlsx file
    XLSX.writeFile(workbook, `tasks_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        if (!json || json.length === 0) throw new Error('File is empty');

        const importedTasks = json.map(row => {
          return {
            title: row['Title'] || row['title'] || '',
            description: row['Description'] || row['description'] || '',
            status: ['pending', 'in_progress', 'completed', 'cancelled'].includes(row['Status'] || row['status']) ? (row['Status'] || row['status']) : 'pending',
            priority: ['low', 'medium', 'high', 'urgent'].includes(row['Priority'] || row['priority']) ? (row['Priority'] || row['priority']) : 'medium',
            dueDate: row['Due Date'] || row['dueDate'] || '',
            dueTime: row['Due Time'] || row['dueTime'] || '',
            tags: (row['Tags'] || row['tags']) ? String(row['Tags'] || row['tags']).split(',').map(t => t.trim()) : []
          };
        }).filter(t => t.title); // Title is required

        setLoading(true);
        const res = await fetch('/api/tasks/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks: importedTasks })
        });
        
        if (!res.ok) throw new Error();
        
        const dataRes = await res.json();
        setTasks(prev => [...dataRes.tasks, ...prev]);
        success(`Successfully imported ${dataRes.count} tasks!`);
      } catch (err) {
        error('Failed to import tasks. Ensure it is a valid Excel file.');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="page-container animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Management</h1>
          <p className="page-subtitle">{tasks.length} tasks total</p>
        </div>
        <div className="flex gap-2">
          <input type="file" accept=".xlsx,.xls,.csv" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} />
          <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()} title="Import Tasks from Excel">
            <Upload size={16} /> Import
          </button>
          <button className="btn btn-ghost" onClick={exportExcel} title="Export Tasks to Excel">
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={openNew} id="new-task-btn">
            <Plus size={16} /> New Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {COLUMNS.map((col) => (
          <div key={col.key} className="kanban-column">
            <div className="kanban-column-header">
              <div className="kanban-column-title flex items-center gap-2">
                <span style={{ color: col.color }}>{col.icon}</span>
                <span style={{ color: col.color }}>{col.label}</span>
              </div>
              <span className="badge badge-muted">{tasksByStatus(col.key).length}</span>
            </div>

            <div>
              {loading ? (
                [...Array(2)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 8, borderRadius: 8 }} />)
              ) : tasksByStatus(col.key).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  No tasks here
                </div>
              ) : (
                tasksByStatus(col.key).map((task) => (
                  <div key={task._id} className="kanban-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-1">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_CONFIG[task.priority].color, display: 'inline-block', marginTop: 2 }} />
                        <span style={{ fontSize: '0.7rem', color: PRIORITY_CONFIG[task.priority].color, fontWeight: 600 }}>
                          {PRIORITY_CONFIG[task.priority].label}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button className="btn-icon-sm btn-ghost" onClick={() => openEdit(task)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn-icon-sm btn-ghost" onClick={() => remove(task._id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem' }}>{task.title}</div>
                    {task.description && <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }} className="truncate">{task.description}</div>}
                    {task.dueDate && (
                      <div style={{ fontSize: '0.725rem', color: new Date(task.dueDate) < new Date() ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {new Date(task.dueDate) < new Date() && <AlertCircle size={11} />}
                        {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {task.dueTime || ''}
                      </div>
                    )}
                    {/* Move buttons */}
                    <div className="flex gap-1 mt-2" style={{ flexWrap: 'wrap' }}>
                      {COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                        <button key={c.key} onClick={() => moveTask(task._id, c.key)} className="btn btn-ghost" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', color: c.color, borderRadius: 6 }}>
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={openNew}
              style={{ width: '100%', padding: '0.5rem', background: 'none', border: '1px dashed var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.5rem', transition: 'all 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)', e.currentTarget.style.color = 'var(--primary-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)', e.currentTarget.style.color = 'var(--text-muted)')}
            >
              + Add task
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editTask ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input id="task-title" className="form-input" placeholder="Task title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea id="task-desc" className="form-textarea" placeholder="Optional details..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ minHeight: 80 }} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select id="task-priority" className="form-select" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select id="task-status" className="form-select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input id="task-duedate" type="date" className="form-input" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Due Time</label>
                <input id="task-duetime" type="time" className="form-input" value={form.dueTime} onChange={(e) => setForm((f) => ({ ...f, dueTime: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input id="task-tags" className="form-input" placeholder="sales, urgent, client" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-between" style={{ marginTop: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button id="task-save-btn" className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Saving...</> : editTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
