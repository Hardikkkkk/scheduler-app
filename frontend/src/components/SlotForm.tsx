import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface SlotFormProps {
  dayOfWeek: number;
  onSubmit: (startTime: string, endTime: string) => void;
  onCancel: () => void;
}

export default function SlotForm({ onSubmit, onCancel }: SlotFormProps) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) return alert('Start and end times are required.');
    if (startTime >= endTime) return alert('End time must be after start time.');
    onSubmit(startTime, endTime);
  };

  const presets = [
    { label: 'Morning (9–11 AM)', start: '09:00', end: '11:00' },
    { label: 'Early Afternoon (1–3 PM)', start: '13:00', end: '15:00' },
    { label: 'Late Afternoon (3–5 PM)', start: '15:00', end: '17:00' },
    { label: 'Evening (5–7 PM)', start: '17:00', end: '19:00' },
  ];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Quick Presets */}
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
          Quick Window Presets
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setStartTime(p.start);
                setEndTime(p.end);
              }}
              className="glass-pill"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#e2e8f0',
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
            Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="glass-input"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '14px',
              fontWeight: '700',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
            End Time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="glass-input"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '14px',
              fontWeight: '700',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
        <button
          type="button"
          onClick={onCancel}
          className="glass-pill"
          style={{
            flex: 1,
            padding: '11px',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="gradient-btn"
          style={{
            flex: 2,
            padding: '11px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          Save Availability Window
        </motion.button>
      </div>
    </form>
  );
}
