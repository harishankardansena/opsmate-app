'use client';
// app/register/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', designation: '', phone: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) return setError('Name, email, and password are required.');
    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setError(data.error || 'Registration failed');
    else router.push('/login?registered=true');
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="sidebar-logo-icon" style={{ width: 44, height: 44, fontSize: '1.125rem' }}>O</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.375rem', fontWeight: 700, background: 'linear-gradient(135deg, var(--primary-light), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            OpsMate
          </div>
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Create your account</h2>
        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
          First user gets Admin access automatically
        </p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--danger)', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="reg-name">Full Name *</label>
              <input id="reg-name" className="form-input" placeholder="Rahul Sharma" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="reg-phone">Phone</label>
              <input id="reg-phone" className="form-input" placeholder="+91 99999 88888" value={form.phone} onChange={set('phone')} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" htmlFor="reg-email">Email *</label>
            <input id="reg-email" type="email" className="form-input" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" htmlFor="reg-password">Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={set('password')}
                required
                style={{ paddingRight: '2.75rem' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="reg-dept">Department</label>
              <input id="reg-dept" className="form-input" placeholder="Sales, BD, Ops..." value={form.department} onChange={set('department')} />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="reg-desig">Designation</label>
              <input id="reg-desig" className="form-input" placeholder="BDE, Manager..." value={form.designation} onChange={set('designation')} />
            </div>
          </div>

          <button type="submit" id="register-submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Creating account...</> : <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
