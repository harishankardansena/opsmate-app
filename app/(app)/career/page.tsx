'use client';
// app/(app)/career/page.tsx
import { useState, useEffect } from 'react';
import { Briefcase, Target, Award, Code, Upload, Plus, Trash2, CheckCircle, Save } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface CareerGoal { _id?: string; title: string; achieved: boolean; }
interface Cert { _id?: string; name: string; issuer: string; }

export default function CareerPage() {
  const [career, setCareer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const [skills, setSkills] = useState('');
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole, setTargetRole] = useState('');

  useEffect(() => {
    fetch('/api/career').then(r => r.json()).then(d => {
      if (d.career) {
        setCareer(d.career);
        setSkills((d.career.skills || []).join(', '));
        setGoals(d.career.goals || []);
        setCerts(d.career.certifications || []);
        setCurrentRole(d.career.currentRole || '');
        setTargetRole(d.career.targetRole || '');
      }
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const body = {
      currentRole,
      targetRole,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      goals,
      certifications: certs,
    };
    try {
      const res = await fetch('/api/career', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      success('Career profile updated!');
    } catch {
      error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addGoal = () => setGoals([...goals, { title: 'New Goal', achieved: false }]);
  const toggleGoal = (idx: number) => {
    const newG = [...goals];
    newG[idx].achieved = !newG[idx].achieved;
    setGoals(newG);
  };
  const updateGoal = (idx: number, t: string) => {
    const newG = [...goals];
    newG[idx].title = t;
    setGoals(newG);
  };
  const removeGoal = (idx: number) => setGoals(goals.filter((_, i) => i !== idx));

  const addCert = () => setCerts([...certs, { name: 'New Cert', issuer: '' }]);
  const updateCert = (idx: number, f: 'name' | 'issuer', v: string) => {
    const newC = [...certs];
    newC[idx][f] = v;
    setCerts(newC);
  };
  const removeCert = (idx: number) => setCerts(certs.filter((_, i) => i !== idx));

  if (loading) return <div className="page-container"><div className="skeleton" style={{ height: 400 }} /></div>;

  return (
    <div className="page-container animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Career Hub</h1>
          <p className="page-subtitle">Track your professional growth, skills, and resume.</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <div className="spinner" style={{ borderTopColor: '#fff', width: 16, height: 16 }} /> : <Save size={16} />} Save Profile
        </button>
      </div>

      <div className="grid-2" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
        
        {/* Profile Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={18} color="var(--primary-light)" /> Current vs Target
            </h3>
            <div className="form-group">
              <label className="form-label">Current Role</label>
              <input className="form-input" placeholder="e.g. Sales Executive" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Target Role</label>
              <input className="form-input" placeholder="e.g. Area Sales Manager" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Code size={18} color="var(--accent)" /> Core Skills
            </h3>
            <div className="form-group mb-0">
              <label className="form-label">Skills (comma-separated)</label>
              <textarea className="form-textarea" placeholder="B2B Sales, CRM, Negotiation..." value={skills} onChange={(e) => setSkills(e.target.value)} style={{ minHeight: 80 }} />
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={18} color="var(--info)" /> Resume Vault
            </h3>
            <p className="text-muted text-sm mb-4">Go to the Document Vault to upload and manage your resumes using the "Resume" category.</p>
            <button className="btn btn-ghost btn-sm" onClick={() => window.location.href='/documents'}>Go to Documents →</button>
          </div>
        </div>

        {/* Goals & Certifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={18} color="var(--warning)" /> Career Goals
              </h3>
              <button className="btn-icon-sm btn-ghost" onClick={addGoal}><Plus size={16} /></button>
            </div>
            
            <div className="flex flex-col gap-2">
              {goals.length === 0 ? <p className="text-sm text-muted">No goals added yet.</p> : goals.map((g, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <button onClick={() => toggleGoal(i)} className="btn-icon-sm" style={{ color: g.achieved ? 'var(--success)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <CheckCircle size={18} />
                  </button>
                  <input className="form-input flex-1" style={{ padding: '0.4rem 0.75rem', textDecoration: g.achieved ? 'line-through' : 'none', color: g.achieved ? 'var(--text-muted)' : 'inherit' }} value={g.title} onChange={(e) => updateGoal(i, e.target.value)} />
                  <button onClick={() => removeGoal(i)} className="btn-icon-sm text-danger btn-ghost"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} color="var(--success)" /> Certifications
              </h3>
              <button className="btn-icon-sm btn-ghost" onClick={addCert}><Plus size={16} /></button>
            </div>
            
            <div className="flex flex-col gap-3">
              {certs.length === 0 ? <p className="text-sm text-muted">No certifications added yet.</p> : certs.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: 'var(--bg-glass)', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input className="form-input" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }} placeholder="Certificate Name" value={c.name} onChange={(e) => updateCert(i, 'name', e.target.value)} />
                    <input className="form-input" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }} placeholder="Issuer (e.g. Coursera)" value={c.issuer} onChange={(e) => updateCert(i, 'issuer', e.target.value)} />
                  </div>
                  <button onClick={() => removeCert(i)} className="btn-icon-sm text-danger btn-ghost" style={{ marginTop: '0.2rem' }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
