import { useState } from 'react';

interface HeaderProps {
  currentView: 'host' | 'client';
  onViewChange: (view: 'host' | 'client') => void;
  timezone: string;
  onTimezoneChange: (tz: string) => void;
}

const COMMON_TIMEZONES = [
  { label: 'India Standard Time (IST)', value: 'Asia/Kolkata' },
  { label: 'US Eastern (EST / EDT)', value: 'America/New_York' },
  { label: 'US Central (CST / CDT)', value: 'America/Chicago' },
  { label: 'US Pacific (PST / PDT)', value: 'America/Los_Angeles' },
  { label: 'London (GMT / BST)', value: 'Europe/London' },
  { label: 'Central European (CET)', value: 'Europe/Paris' },
  { label: 'Singapore (SGT)', value: 'Asia/Singapore' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Sydney (AEST)', value: 'Australia/Sydney' },
];

export default function Header({
  currentView,
  onViewChange,
  timezone,
  onTimezoneChange,
}: HeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header
      style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: '800',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
                Orbit Scheduler
              </span>
              <span
                style={{
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '1px 6px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                }}
              >
                PRO
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Modern Scheduling Engine</span>
          </div>
        </div>

        {/* Center: Dual-Mode Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}
        >
          <button
            type="button"
            onClick={() => onViewChange('host')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '9px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: currentView === 'host' ? 'white' : 'transparent',
              color: currentView === 'host' ? '#0f172a' : '#64748b',
              boxShadow: currentView === 'host' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🛠️</span>
            <span>Host Manager</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('client')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '9px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: currentView === 'client' ? 'white' : 'transparent',
              color: currentView === 'client' ? '#0f172a' : '#64748b',
              boxShadow: currentView === 'client' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🌐</span>
            <span>Client Booking Page</span>
          </button>
        </div>

        {/* Right Actions: Timezone selector + Share link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Timezone Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>🌍</span>
            <select
              value={timezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: 'white',
                color: '#334155',
                fontSize: '12px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: copied ? '#16a34a' : '#4f46e5',
              color: 'white',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{copied ? '✓' : '🔗'}</span>
            <span>{copied ? 'Copied Link!' : 'Share Link'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
