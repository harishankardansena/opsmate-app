'use client';
// app/(app)/knowledge-base/page.tsx
import { useState, useEffect } from 'react';
import { BookOpen, Search, FileText, CheckSquare, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  link: string;
}

const TYPE_ICONS: Record<string, any> = {
  Task: <CheckSquare size={16} color="var(--primary-light)" />,
  Note: <FileText size={16} color="var(--info)" />,
  Lead: <Users size={16} color="var(--accent)" />,
};

export default function KnowledgeBasePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const delay = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(d => setResults(d.results || []))
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="page-container animate-fade">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(108,99,255,0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--primary-light)' }}>
              <BookOpen size={32} />
            </div>
          </div>
          <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Knowledge Base</h1>
          <p className="page-subtitle" style={{ fontSize: '1rem' }}>Search across all your tasks, notes, leads, and documents.</p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '3rem', paddingRight: '3rem', fontSize: '1.125rem', height: 60, borderRadius: 30, boxShadow: '0 8px 30px rgba(0,0,0,0.2)', background: 'var(--bg-glass)' }}
            placeholder="Search for anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {loading && <div className="spinner" style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)' }} />}
        </div>

        {query.trim() && !loading && results.length === 0 && (
          <div className="empty-state glass-card">
            <p>No results found for "{query}"</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="glass-card" style={{ padding: '0.5rem' }}>
            {results.map((res, i) => (
              <Link key={`${res.type}-${res.id}`} href={res.link} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: 8, transition: 'background 0.2s', textDecoration: 'none', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none' }} className="hover:bg-glass">
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {TYPE_ICONS[res.type] || <FileText size={16} />}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.125rem' }} className="truncate">{res.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>{res.type}</span>
                    <span className="truncate">{res.subtitle}</span>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </Link>
            ))}
          </div>
        )}
        
        {!query && (
          <div className="grid-2" style={{ gap: '1rem', marginTop: '3rem' }}>
            {/* Quick links to specific modules if needed */}
          </div>
        )}
      </div>
    </div>
  );
}
