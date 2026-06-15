'use client';
// components/TopBar.tsx
import { useState, useEffect } from 'react';
import { Search, Bell, Zap, Command, Download, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import AICommandPalette from './AICommandPalette';
import { useToast } from '@/components/Toast';
import * as XLSX from 'xlsx';

export default function TopBar() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string } | undefined;
  const [commandOpen, setCommandOpen] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [time, setTime] = useState('');
  const [exporting, setExporting] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const tick = () => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const exportFullWorkspace = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export');
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || 'Export failed');
      
      const { tasks, notes, leads, followUps } = json.data;
      const workbook = XLSX.utils.book_new();

      // Tasks Sheet
      if (tasks && tasks.length > 0) {
        const tData = tasks.map((t: any) => ({
          'Title': t.title, 'Status': t.status, 'Priority': t.priority,
          'Due Date': t.dueDate ? t.dueDate.split('T')[0] : '', 'Due Time': t.dueTime,
          'Tags': (t.tags || []).join(', '), 'Created': new Date(t.createdAt).toLocaleString()
        }));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(tData), 'Tasks');
      }

      // Notes Sheet
      if (notes && notes.length > 0) {
        const nData = notes.map((n: any) => ({
          'Title': n.title, 'Type': n.type, 'Tags': (n.tags || []).join(', '),
          'AI Summary': n.aiSummary || '', 'Action Items': (n.actionItems || []).join('\\n'),
          'Created': new Date(n.createdAt).toLocaleString()
        }));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(nData), 'Notes');
      }

      // Leads Sheet
      if (leads && leads.length > 0) {
        const lData = leads.map((l: any) => ({
          'Name': l.name, 'Company': l.company || '', 'Email': l.email || '',
          'Phone': l.phone || '', 'Status': l.status, 'Source': l.source || '',
          'Value': l.value || '', 'Created': new Date(l.createdAt).toLocaleString()
        }));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(lData), 'Leads');
      }

      // FollowUps Sheet
      if (followUps && followUps.length > 0) {
        const fData = followUps.map((f: any) => ({
          'Type': f.type, 'Entity Type': f.entityType, 'Title': f.title,
          'Scheduled For': f.scheduledFor ? new Date(f.scheduledFor).toLocaleString() : '',
          'Status': f.status, 'Created': new Date(f.createdAt).toLocaleString()
        }));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(fData), 'Follow-Ups');
      }

      // Ensure at least one sheet exists
      if (workbook.SheetNames.length === 0) {
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ Message: 'No data found in workspace' }]), 'Empty');
      }

      XLSX.writeFile(workbook, `opsmate_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
      success('Workspace exported successfully!');
    } catch (err) {
      error('Failed to export workspace data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <header className="topbar">
        {/* Greeting */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{greeting}</span>
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {user?.name?.split(' ')[0] ?? 'there'} 👋
          </span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* AI Command Button */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setCommandOpen(true)}
          title="Open AI Command Palette (Ctrl+K)"
          id="open-command-palette"
          style={{ gap: '0.5rem', minWidth: 160 }}
        >
          <Zap size={15} color="var(--accent)" />
          <span>Ask AI</span>
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.7rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '1px 5px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}>
            <Command size={10} />K
          </span>
        </button>

        {/* Time */}
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '0 0.5rem' }}>{time}</div>

        {/* Global Export */}
        <button 
          className="topbar-icon-btn" 
          onClick={exportFullWorkspace} 
          title="Backup Workspace Data"
          disabled={exporting}
          style={{ width: 'auto', padding: '0 0.75rem', gap: '0.375rem', fontWeight: 500, fontSize: '0.8125rem' }}
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          <span>Backup</span>
        </button>

        {/* Notification */}
        <button className="topbar-icon-btn" id="notifications-btn" title="Notifications">
          <Bell size={18} />
          <span className="notif-dot" />
        </button>
      </header>

      {commandOpen && <AICommandPalette onClose={() => setCommandOpen(false)} />}
    </>
  );
}
