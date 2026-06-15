'use client';
// app/(app)/ai-chat/page.tsx
import { useState, useEffect, useRef } from 'react';
import { Send, Zap, User, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  aiStatus?: 'gemini' | 'groq' | 'offline';
}

export default function AIChatPage() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/ai/chat').then((r) => r.json()).then((d) => {
      if (d.messages) setMessages(d.messages);
    });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMsg }].map(m => ({ role: m.role, content: m.content })),
        })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text, aiStatus: data.status }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Oops, something went wrong. I couldn't reach the servers.", aiStatus: 'offline' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const formatText = (txt: string) => {
    return txt.split('\\n').map((line, i) => (
      <span key={i}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', paddingBottom: '1rem' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title flex items-center gap-2"><Zap size={24} color="var(--accent)" /> OpsMate Assistant</h1>
          <p className="page-subtitle">Your AI co-pilot for work, tasks, and strategy.</p>
        </div>
      </div>

      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.length === 0 ? (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <div style={{ background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '50%', marginBottom: '1rem', boxShadow: '0 4px 12px var(--primary-glow)' }}>
                <Zap size={32} />
              </div>
              <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>How can I help you today?</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ask me to summarize notes, analyze leads, or schedule tasks.</p>
              <div className="flex gap-2 mt-4 flex-wrap justify-center">
                <button className="btn btn-ghost btn-sm" onClick={() => setInput('What are my pending tasks for today?')}>What are my tasks?</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setInput('Draft a follow-up email to an interested lead.')}>Draft an email</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setInput('Help me improve my career goals.')}>Career advice</button>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.role === 'user' ? 'var(--bg-elevated)' : 'var(--primary)', color: m.role === 'user' ? 'var(--text-primary)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: m.role === 'user' ? '1px solid var(--border)' : 'none', boxShadow: m.role === 'assistant' ? '0 4px 12px var(--primary-glow)' : 'none' }}>
                  {m.role === 'user' ? <User size={16} /> : <Zap size={16} />}
                </div>
                <div style={{
                  maxWidth: '75%',
                  background: m.role === 'user' ? 'var(--bg-elevated)' : 'rgba(108,99,255,0.05)',
                  border: `1px solid ${m.role === 'user' ? 'var(--border)' : 'rgba(108,99,255,0.1)'}`,
                  padding: '1rem',
                  borderRadius: 12,
                  borderTopRightRadius: m.role === 'user' ? 2 : 12,
                  borderTopLeftRadius: m.role === 'assistant' ? 2 : 12,
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem',
                  lineHeight: 1.6
                }}>
                  {formatText(m.content)}
                  {m.aiStatus === 'offline' && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--warning)' }}>
                      <AlertCircle size={10} /> Local offline response
                    </div>
                  )}
                  {m.aiStatus === 'groq' && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--info)' }}>
                      <Zap size={10} /> Groq Fallback
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px var(--primary-glow)' }}>
                <Zap size={16} />
              </div>
              <div style={{ padding: '1rem', display: 'flex', gap: '4px' }}>
                <div className="typing-dot" />
                <div className="typing-dot" style={{ animationDelay: '0.2s' }} />
                <div className="typing-dot" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--bg-glass)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
            <textarea
              className="form-input"
              style={{ paddingRight: '3rem', minHeight: '50px', maxHeight: '150px', resize: 'none', lineHeight: 1.5, paddingTop: '0.75rem', paddingBottom: '0.75rem', borderRadius: 24 }}
              placeholder="Message OpsMate..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={1}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 34, height: 34, borderRadius: '50%', background: input.trim() && !loading ? 'var(--primary)' : 'var(--bg-elevated)',
                color: input.trim() && !loading ? 'white' : 'var(--text-muted)', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
              }}
            >
              <Send size={16} style={{ marginLeft: 2 }} />
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            OpsMate AI can make mistakes. Consider verifying critical information.
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .typing-dot { width: 6px; height: 6px; background: var(--text-muted); border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; }
        @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
      `}} />
    </div>
  );
}
