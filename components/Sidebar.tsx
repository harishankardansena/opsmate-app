'use client';
// components/Sidebar.tsx
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard, CheckSquare, Users, Bell, FileText, FolderOpen,
  BarChart2, Calculator, MessageSquare, Briefcase, Mail, BookOpen,
  Shield, ChevronLeft, ChevronRight, LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', section: 'Main' },
  { href: '/tasks', icon: <CheckSquare size={20} />, label: 'Tasks', section: 'Main' },
  { href: '/leads', icon: <Users size={20} />, label: 'Leads', section: 'Main' },
  { href: '/followups', icon: <Bell size={20} />, label: 'Follow-ups', section: 'Main' },
  { href: '/notes', icon: <FileText size={20} />, label: 'Notes & Meetings', section: 'Workspace' },
  { href: '/documents', icon: <FolderOpen size={20} />, label: 'Document Vault', section: 'Workspace' },
  { href: '/performance', icon: <BarChart2 size={20} />, label: 'Performance', section: 'Analytics' },
  { href: '/incentives', icon: <Calculator size={20} />, label: 'Incentive Calc', section: 'Analytics' },
  { href: '/ai-chat', icon: <MessageSquare size={20} />, label: 'AI Assistant', section: 'AI Tools' },
  { href: '/email-assistant', icon: <Mail size={20} />, label: 'Email Assistant', section: 'AI Tools' },
  { href: '/career', icon: <Briefcase size={20} />, label: 'Career Hub', section: 'AI Tools' },
  { href: '/knowledge-base', icon: <BookOpen size={20} />, label: 'Knowledge Base', section: 'AI Tools' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as { id?: string; name?: string; email?: string; role?: string } | undefined;
  const isAdmin = user?.role === 'admin';

  const sections = Array.from(new Set(NAV_ITEMS.map((i) => i.section)));

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">O</div>
        {!collapsed && <span className="sidebar-logo-text">OpsMate</span>}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section}>
            {!collapsed && <div className="nav-section-label">{section}</div>}
            {NAV_ITEMS.filter((i) => i.section === section).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-item-icon">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}

        {isAdmin && (
          <div>
            {!collapsed && <div className="nav-section-label">Administration</div>}
            <Link
              href="/admin"
              className={`nav-item ${pathname.startsWith('/admin') ? 'active' : ''}`}
              title={collapsed ? 'Admin Panel' : undefined}
            >
              <span className="nav-item-icon"><Shield size={20} /></span>
              {!collapsed && <span>Admin Panel</span>}
            </Link>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.role === 'admin' ? '👑 Admin' : 'Member'}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="btn-icon"
              style={{ background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', padding: '0.375rem', display: 'flex', alignItems: 'center' }}
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="user-avatar" onClick={() => signOut({ callbackUrl: '/login' })} title="Sign out">{initials}</div>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          position: 'absolute',
          right: -12,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-light)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          zIndex: 10,
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
