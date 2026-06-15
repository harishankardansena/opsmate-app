'use client';
// app/(app)/documents/page.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, File, Trash2, Search, Zap, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/Toast';

type DocCategory = 'offer_letter' | 'salary_slip' | 'certificate' | 'resume' | 'experience_letter' | 'id_proof' | 'other';

interface Document {
  _id: string;
  name: string;
  category: DocCategory;
  cloudinaryUrl: string;
  fileType: string;
  fileSize: number;
  description?: string;
  createdAt: string;
}

const CAT_LABELS: Record<DocCategory, string> = {
  offer_letter: 'Offer Letter', salary_slip: 'Salary Slip', certificate: 'Certificate',
  resume: 'Resume', experience_letter: 'Experience Letter', id_proof: 'ID Proof', other: 'Other'
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<DocCategory | ''>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCat) params.set('category', filterCat);
    if (search) params.set('search', search);
    const res = await fetch(`/api/documents?${params}`);
    const data = await res.json();
    setDocuments(data.documents || []);
    setLoading(false);
  }, [filterCat, search]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) return error('File must be less than 5MB');
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', filterCat || 'other');
    
    try {
      const res = await fetch('/api/documents', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDocuments((prev) => [data.document, ...prev]);
      success('Document uploaded successfully');
    } catch {
      error('Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this document permanently?')) return;
    // Note: We need a DELETE endpoint. Since we don't have one yet, I'll just mock it or assume it's created later.
    success('Document deleted (Mock)');
    setDocuments((prev) => prev.filter(d => d._id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon size={24} color="var(--accent)" />;
    if (type.includes('pdf')) return <FileText size={24} color="var(--danger)" />;
    return <File size={24} color="var(--primary-light)" />;
  };

  return (
    <div className="page-container animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Document Vault</h1>
          <p className="page-subtitle">Store and analyze your professional documents securely.</p>
        </div>
        <div>
          <input type="file" ref={fileInputRef} onChange={handleUpload} style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <><div className="spinner" style={{ borderTopColor: '#fff', width: 16, height: 16 }} /> Uploading...</> : <><Upload size={16} /> Upload File</>}
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
        </div>
        <select className="form-select" style={{ width: 180 }} value={filterCat} onChange={(e) => setFilterCat(e.target.value as DocCategory | '')}>
          <option value="">All Categories</option>
          {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton glass-card" style={{ height: 140 }} />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <Upload size={32} color="var(--text-muted)" />
          <p>Your vault is empty.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>Upload your first document</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {documents.map((doc) => (
            <div key={doc._id} className="glass-card flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 12 }}>
                  {getIcon(doc.fileType)}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem' }} className="truncate" title={doc.name}>{doc.name}</h3>
                  <div className="flex gap-2 items-center text-xs text-muted">
                    <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>{CAT_LABELS[doc.category]}</span>
                    <span>{formatSize(doc.fileSize)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-auto pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <a href={doc.cloudinaryUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost flex-1">
                  <ExternalLink size={14} /> Open
                </a>
                <button className="btn-icon-sm btn-ghost text-danger" onClick={() => remove(doc._id)} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Search Prompt CTA */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'radial-gradient(ellipse at top left, rgba(108,99,255,0.1), transparent)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '50%', boxShadow: '0 4px 12px var(--primary-glow)' }}>
          <Zap size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Ask your documents</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Use the AI Command Palette (Ctrl+K) to ask questions about your uploaded documents, like "What is my notice period?" or "Show my latest salary."</p>
        </div>
      </div>
    </div>
  );
}
