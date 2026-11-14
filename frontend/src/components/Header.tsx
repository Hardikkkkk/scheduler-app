import { useState } from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
  currentView: 'host' | 'client';
  onViewChange: (view: 'host' | 'client') => void;
  timezone: string;
  onTimezoneChange: (tz: string) => void;
}

const COMMON_TIMEZONES = [
  { label: 'India (IST)', value: 'Asia/Kolkata' },
  { label: 'US Eastern (EST)', value: 'America/New_York' },
  { label: 'US Central (CST)', value: 'America/Chicago' },
  { label: 'US Pacific (PST)', value: 'America/Los_Angeles' },
  { label: 'London (GMT)', value: 'Europe/London' },
  { label: 'Europe (CET)', value: 'Europe/Paris' },
  { label: 'Singapore (SGT)', value: 'Asia/Singapore' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
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
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '14px 28px',
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
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
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              fontWeight: '800',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              cursor: 'pointer',
            }}
          >
            ⚡
          </motion.div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '19px',
                  fontWeight: '800',
                  color: '#0f172a',
                  letterSpacing: '-0.03em',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Orbit Scheduler
              </span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 7px',
                  borderRadius: '20px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)',
                }}
              >
                PRO
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              Glassmorphic Availability Suite
            </span>
          </div>
        </div>

        {/* Center: Dual-Mode Animated Switcher (React Bits Style) */}
        <div
          className="glass-pill"
          style={{
            display: 'flex',
            padding: '4px',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={() => onViewChange('host')}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              color: currentView === 'host' ? '#4f46e5' : '#64748b',
              backgroundColor: 'transparent',
              zIndex: 2,
              transition: 'color 0.2s ease',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {currentView === 'host' && (
              <motion.div
                layoutId="activeViewTab"
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0,0,0,0.04)',
                  zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span>🛠️</span>
            <span>Host Manager</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('client')}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              color: currentView === 'client' ? '#4f46e5' : '#64748b',
              backgroundColor: 'transparent',
              zIndex: 2,
              transition: 'color 0.2s ease',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {currentView === 'client' && (
              <motion.div
                layoutId="activeViewTab"
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0,0,0,0.04)',
                  zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span>🌐</span>
            <span>Client Booking Page</span>
          </button>
        </div>

        {/* Right Actions: Timezone selector + Gradient Share Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Timezone Pill */}
          <div
            className="glass-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
            }}
          >
            <span style={{ fontSize: '13px' }}>🌍</span>
            <select
              value={timezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                color: '#334155',
                fontSize: '12px',
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
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
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={handleCopyLink}
            className="gradient-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <span>{copied ? '✓' : '🔗'}</span>
            <span>{copied ? 'Copied Link!' : 'Share Link'}</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
