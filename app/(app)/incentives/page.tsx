'use client';
// app/(app)/incentives/page.tsx
import { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, Award, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function IncentivePage() {
  const [salesAmount, setSalesAmount] = useState('');
  const [dealCount, setDealCount] = useState('');
  const [baseTarget, setBaseTarget] = useState('500000'); // ₹5L default target
  const [commissionRate, setCommissionRate] = useState('5'); // 5% default

  const sales = Number(salesAmount) || 0;
  const target = Number(baseTarget) || 0;
  const rate = Number(commissionRate) || 0;

  // Tiered commission logic simulation
  let actualCommission = 0;
  if (sales > 0) {
    if (sales >= target) {
      // Met target: 100% of standard commission + 2% bonus on overachieved amount
      actualCommission = (sales * rate) / 100;
      const overachieved = sales - target;
      if (overachieved > 0) {
        actualCommission += (overachieved * 2) / 100; // 2% kicker
      }
    } else {
      // Below target: standard commission but maybe a slight penalty or just standard
      actualCommission = (sales * rate) / 100;
    }
  }

  const progress = target > 0 ? Math.min(100, Math.round((sales / target) * 100)) : 0;
  
  const chartData = [
    { name: 'Achieved', value: sales },
    { name: 'Remaining', value: Math.max(0, target - sales) }
  ];
  const COLORS = ['var(--success)', 'rgba(255,255,255,0.1)'];

  return (
    <div className="page-container animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Incentive Calculator</h1>
          <p className="page-subtitle">Project your earnings and track target achievement.</p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '2rem' }}>
        {/* Calculator Form */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={18} color="var(--accent)" /> Enter Your Numbers
          </h3>
          
          <div className="form-group">
            <label className="form-label">Monthly Target (₹)</label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="number" className="form-input" style={{ paddingLeft: '2.5rem' }} value={baseTarget} onChange={(e) => setBaseTarget(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Total Sales Achieved (₹)</label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="number" className="form-input" style={{ paddingLeft: '2.5rem', borderColor: 'var(--success)', color: 'var(--success)', fontWeight: 600 }} value={salesAmount} onChange={(e) => setSalesAmount(e.target.value)} placeholder="e.g. 600000" />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group mb-0">
              <label className="form-label">Base Commission (%)</label>
              <input type="number" className="form-input" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Deals Closed</label>
              <input type="number" className="form-input" value={dealCount} onChange={(e) => setDealCount(e.target.value)} placeholder="e.g. 5" />
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <strong>Note:</strong> Surpassing your target adds a standard 2% kicker bonus to the overachieved amount.
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Earnings Card */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(0,212,170,0.05))', border: '1px solid rgba(16,185,129,0.2)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Projected Earnings
            </h3>
            <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--success)', marginBottom: '1rem', textShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
              ₹{actualCommission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            
            {sales > target && (
              <div className="badge" style={{ background: 'var(--success)', color: 'black', padding: '0.4rem 0.8rem', fontWeight: 600 }}>
                <Award size={14} /> Target Exceeded (+2% Bonus Applied)
              </div>
            )}
          </div>

          {/* Target Progress */}
          <div className="glass-card flex-1">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Target Achievement</h3>
            <div className="flex items-center gap-4">
              <div style={{ width: 120, height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} innerRadius={40} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{progress}%</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>of ₹{target.toLocaleString('en-IN')} goal</div>
                
                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: progress >= 100 ? 'var(--success)' : 'var(--primary-light)', transition: 'width 0.5s ease-out' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
