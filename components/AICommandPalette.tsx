'use client';
// components/AICommandPalette.tsx
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, CheckSquare, Users, Bell, FileText, BarChart2, Mail, X, ArrowRight } from 'lucide-react';
import { useToast } from './Toast';

const QUICK_COMMANDS = [
  { label: 'Go to Dashboard', icon: <BarChart2 size={16} />, action: 'navigate', href: '/dashboard' },
  { label: 'Create a new Task', icon: <CheckSquare size={16} />, action: 'navigate', href: '/tasks?new=true' },
  { label: 'Add a new Lead', icon: <Users size={16} />, action: 'navigate', href: '/leads?new=true' },
  { label: 'Schedule a Follow-up', icon: <Bell size={16} />, action: 'navigate', href: '/followups?new=true' },
  { label: 'Write Meeting Notes', icon: <FileText size={16} />, action: 'navigate', href: '/notes?new=true' },
  { label: 'Generate an Email', icon: <Mail size={16} />, action: 'navigate', href: '/email-assistant' },
  { label: 'Open AI Chat', icon: <Zap size={16} />, action: 'navigate', href: '/ai-chat' },
];

export default function AICommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query
    ? QUICK_COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : QUICK_COMMANDS;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter') {
      if (filtered[selected]) {
        router.push(filtered[selected].href);
        onClose();
      } else if (query.trim()) {
        handleAIQuery();
      }
    }
  };

  const handleAIQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: query }] }),
      });
      const data = await res.json();
      setAiResponse(data.text || 'No response');
    } catch {
      toast('AI unavailable. Opening AI Chat...', 'warning');
      router.push('/ai-chat');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="command-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-input">
          <Zap size={18} color="var(--accent)" />
          <input
            ref={inputRef}
            placeholder="Ask AI or type a command..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setAiResponse(''); setSelected(0); }}
            onKeyDown={handleKeyDown}
            id="command-palette-input"
          />
          {loading && <div className="spinner" />}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {aiResponse ? (
          <div className="command-results">
            <div style={{ padding: '1rem', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Zap size={14} color="var(--accent)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>AI Response</span>
              </div>
              {aiResponse}
            </div>
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-primary btn-sm" onClick={() => { router.push('/ai-chat'); onClose(); }}>
                Continue in AI Chat <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="command-results">
            {filtered.length === 0 && query && (
              <div className="command-item" onClick={handleAIQuery} style={{ color: 'var(--accent)' }}>
                <Zap size={16} />
                <span>Ask AI: &quot;{query}&quot;</span>
                <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
              </div>
            )}
            {filtered.map((cmd, i) => (
              <div
                key={cmd.label}
                className={`command-item ${i === selected ? 'selected' : ''}`}
                onClick={() => { router.push(cmd.href); onClose(); }}
              >
                <span style={{ color: 'var(--primary-light)' }}>{cmd.icon}</span>
                <span>{cmd.label}</span>
                <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
              </div>
            ))}
            {query.trim() && filtered.length > 0 && (
              <div className="command-item" onClick={handleAIQuery} style={{ color: 'var(--accent)', borderTop: '1px solid var(--border)', marginTop: '0.25rem', paddingTop: '0.75rem' }}>
                <Zap size={16} />
                <span>Ask AI: &quot;{query}&quot;</span>
                <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
