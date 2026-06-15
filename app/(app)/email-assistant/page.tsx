'use client';
// app/(app)/email-assistant/page.tsx
import { useState } from 'react';
import { Mail, Zap, Send, Copy, FileText, Briefcase, Handshake } from 'lucide-react';
import { useToast } from '@/components/Toast';

type TemplateType = 'follow_up' | 'cold_outreach' | 'meeting_invite' | 'thank_you' | 'custom';

export default function EmailAssistantPage() {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [context, setContext] = useState('');
  const [type, setType] = useState<TemplateType>('follow_up');
  const [tone, setTone] = useState('professional');
  
  const [generatedBody, setGeneratedBody] = useState('');
  const [generating, setGenerating] = useState(false);
  
  const { success, error } = useToast();

  const handleGenerate = async () => {
    if (!context) return error('Please provide some context for the email');
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, type, tone, recipient })
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setGeneratedBody(data.text);
      if (!subject) setSubject('Follow-up from OpsMate'); // Basic fallback if empty
      success('Email generated successfully!');
    } catch {
      error('Failed to generate email');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenMailClient = () => {
    if (!generatedBody) return;
    const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(generatedBody)}`;
    window.open(mailto, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedBody);
    success('Copied to clipboard!');
  };

  return (
    <div className="page-container animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Mail size={24} color="var(--accent)" /> Email Assistant</h1>
          <p className="page-subtitle">Draft perfect emails with AI and send via your default mail app.</p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Input Form */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--primary-light)" /> Email Details
          </h3>
          
          <div className="form-group">
            <label className="form-label">To (Email)</label>
            <input type="email" className="form-input" placeholder="client@company.com" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Subject Line (Optional)</label>
            <input className="form-input" placeholder="Quick question about our meeting" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Email Type</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value as TemplateType)}>
                <option value="follow_up">Follow Up</option>
                <option value="cold_outreach">Cold Outreach</option>
                <option value="meeting_invite">Meeting Invite</option>
                <option value="thank_you">Thank You</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tone</label>
              <select className="form-select" value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="persuasive">Persuasive</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Key Points / Context *</label>
            <textarea className="form-textarea" placeholder="e.g. Follow up on yesterday's demo, attach the pricing PDF, ask for a Friday meeting." style={{ minHeight: 100 }} value={context} onChange={(e) => setContext(e.target.value)} />
          </div>

          <button className="btn w-full" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', border: 'none' }} onClick={handleGenerate} disabled={generating || !context}>
            {generating ? <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Generating Magic...</> : <><Zap size={16} /> Generate Draft</>}
          </button>
        </div>

        {/* Output & Editor */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} color="var(--warning)" /> AI Draft
            </h3>
            <div className="flex gap-2">
              <button className="btn-icon-sm btn-ghost" onClick={handleCopy} disabled={!generatedBody} title="Copy Body"><Copy size={16} /></button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {generatedBody ? (
              <textarea
                className="form-textarea"
                style={{ flex: 1, minHeight: 250, resize: 'vertical', fontSize: '0.9375rem', lineHeight: 1.6, background: 'var(--bg-glass)' }}
                value={generatedBody}
                onChange={(e) => setGeneratedBody(e.target.value)}
              />
            ) : (
              <div className="empty-state" style={{ flex: 1, minHeight: 250, border: '1px dashed var(--border)', borderRadius: 8 }}>
                <Mail size={32} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                <p>Your AI-generated email will appear here.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>You can edit it before sending.</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-accent" onClick={handleOpenMailClient} disabled={!generatedBody}>
              <Send size={16} /> Open Mail Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
