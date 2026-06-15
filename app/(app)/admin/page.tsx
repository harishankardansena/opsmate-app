'use client';
// app/(app)/admin/page.tsx
import { useState, useEffect } from 'react';
import { Shield, Users, Trash2, Edit2, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Toast';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as { id?: string; role?: string } | undefined;
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  useEffect(() => {
    fetch('/api/admin/users').then(r => {
      if (!r.ok) throw new Error();
      return r.json();
    }).then(d => {
      setUsers(d.users || []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      error('Failed to load users or access denied');
    });
  }, [error]);

  const toggleRole = async (u: UserData) => {
    if (u._id === currentUser?.id) return error('Cannot change your own role');
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: u._id, role: newRole })
      });
      if (!res.ok) throw new Error();
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, role: newRole } : x));
      success(`User is now ${newRole}`);
    } catch {
      error('Failed to update role');
    }
  };

  const removeUser = async (u: UserData) => {
    if (u._id === currentUser?.id) return error('Cannot delete yourself');
    if (!confirm(`Are you sure you want to completely delete ${u.name}?`)) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${u._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setUsers(prev => prev.filter(x => x._id !== u._id));
      success('User deleted');
    } catch {
      error('Failed to delete user');
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="empty-state">
          <ShieldAlert size={48} color="var(--danger)" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '1rem 0' }}>Access Denied</h2>
          <p>You do not have administrative privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Shield size={24} color="var(--danger)" /> Admin Panel</h1>
          <p className="page-subtitle">Manage workspace users and roles.</p>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} color="var(--primary-light)" /> Workspace Users
        </h3>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><div className="skeleton" style={{ height: 40 }} /></td></tr>
              ) : (
                users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>
                      {u.name} {u._id === currentUser.id && <span className="badge badge-muted ml-2" style={{ fontSize: '0.65rem' }}>You</span>}
                    </td>
                    <td>{u.email}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>
                      <span className="badge" style={{ background: u.role === 'admin' ? 'rgba(239,68,68,0.1)' : 'rgba(108,99,255,0.1)', color: u.role === 'admin' ? 'var(--danger)' : 'var(--primary-light)' }}>
                        {u.role === 'admin' ? <Shield size={12} /> : <UserIcon />}
                        <span style={{ textTransform: 'capitalize' }}>{u.role}</span>
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-sm btn-ghost" 
                          onClick={() => toggleRole(u)} 
                          disabled={u._id === currentUser.id}
                        >
                          {u.role === 'admin' ? 'Demote to User' : 'Make Admin'}
                        </button>
                        <button 
                          className="btn-icon-sm btn-ghost text-danger" 
                          onClick={() => removeUser(u)} 
                          disabled={u._id === currentUser.id}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UserIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>; }
