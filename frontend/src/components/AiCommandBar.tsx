import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createSlot } from '../api/slots';

interface AiCommandBarProps {
  onSuccess: () => void;
}

const DAY_MAP: { [key: string]: number } = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const parseTimeString = (timeStr: string): string | null => {
  const clean = timeStr.trim().toLowerCase();
  const match = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const modifier = match[3];

  if (modifier === 'pm' && hours < 12) hours += 12;
  if (modifier === 'am' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export default function AiCommandBar({ onSuccess }: AiCommandBarProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleParseAndExecute = async (inputPrompt: string) => {
    const text = inputPrompt.toLowerCase();
    setLoading(true);
    setMessage(null);

    try {
      const targetDays: number[] = [];
      Object.keys(DAY_MAP).forEach((dayKeyword) => {
        const regex = new RegExp(`\\b${dayKeyword}\\b`, 'i');
        if (regex.test(text)) {
          const dayNum = DAY_MAP[dayKeyword];
          if (!targetDays.includes(dayNum)) {
            targetDays.push(dayNum);
          }
        }
      });

      const timeRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-|until)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
      const match = text.match(timeRegex);

      if (!match) {
        throw new Error('Could not detect time range. Try: "Free Tuesdays from 2pm to 4pm"');
      }

      const startTime = parseTimeString(match[1]);
      const endTime = parseTimeString(match[2]);

      if (!startTime || !endTime) {
        throw new Error('Invalid time format. Please use e.g. "10am to 12pm" or "14:00 to 16:00"');
      }

      const daysToSchedule = targetDays.length > 0 ? targetDays : [new Date().getDay()];

      let createdCount = 0;
      for (const dayOfWeek of daysToSchedule) {
        await createSlot(dayOfWeek, startTime, endTime);
        createdCount++;
      }

      setMessage({
        text: `✨ Success! Added ${createdCount} availability window(s) (${startTime} - ${endTime}).`,
        type: 'success',
      });
      setPrompt('');
      onSuccess();
    } catch (err: any) {
      setMessage({
        text: err.message || 'Failed to parse command. Please check your prompt.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Tue and Thu from 2pm to 4pm',
    'Mon and Wed from 10am to 12pm',
    'Fridays from 3pm to 5pm',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-panel"
      style={{
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>✨</span>
          <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            AI Natural Language Scheduling
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            GPT-Powered
          </span>
        </div>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
          Press Enter to apply rules
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (prompt.trim()) handleParseAndExecute(prompt);
        }}
        style={{ display: 'flex', gap: '10px' }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder='e.g. "Free every Tue and Thu from 2pm to 4pm" or "Open Fridays 10am to 12pm"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '14px',
              border: '1px solid rgba(203, 213, 225, 0.8)',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              fontSize: '14px',
              fontWeight: '500',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1';
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(203, 213, 225, 0.8)';
              e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)';
            }}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || !prompt.trim()}
          className="gradient-btn"
          style={{
            padding: '12px 24px',
            borderRadius: '14px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !prompt.trim() ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <span>{loading ? '⏳' : '✨'}</span>
          <span>{loading ? 'Parsing...' : 'Apply Rule'}</span>
        </motion.button>
      </form>

      {/* Suggested Quick Prompt Pills */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Quick Suggestions:</span>
        {samplePrompts.map((sample) => (
          <motion.button
            key={sample}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => handleParseAndExecute(sample)}
            className="glass-pill"
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              color: '#4f46e5',
              fontWeight: '600',
              cursor: 'pointer',
              border: '1px solid rgba(199, 210, 254, 0.6)',
              backgroundColor: 'rgba(238, 242, 255, 0.7)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            "{sample}"
          </motion.button>
        ))}
      </div>

      {/* Animated Feedback Notification */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            style={{
              marginTop: '14px',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: message.type === 'success' ? '#166534' : '#b91c1c',
              border: message.type === 'success' ? '1px solid #86efac' : '1px solid #fca5a5',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
