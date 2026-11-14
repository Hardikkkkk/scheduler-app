import { useState } from 'react';
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

// Parse standard natural language times (e.g. "10am", "2:30pm", "14:00")
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
      // Find days mentioned in prompt
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

      // Find time ranges: e.g. "10am to 12pm", "2pm - 4pm", "from 14:00 to 16:00"
      const timeRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-|until)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
      const match = text.match(timeRegex);

      if (!match) {
        throw new Error('Could not detect time range. Try e.g.: "Free Tuesdays from 2pm to 4pm"');
      }

      const startTime = parseTimeString(match[1]);
      const endTime = parseTimeString(match[2]);

      if (!startTime || !endTime) {
        throw new Error('Invalid time format. Please use e.g. "10am to 12pm" or "14:00 to 16:00"');
      }

      // Default to today if no specific day mentioned
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
    <div
      style={{
        backgroundColor: '#f8fafc',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '18px' }}>✨</span>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
          AI Natural Language Scheduling
        </span>
        <span
          style={{
            fontSize: '10px',
            fontWeight: '800',
            backgroundColor: '#fae8ff',
            color: '#a21caf',
            padding: '2px 8px',
            borderRadius: '12px',
            textTransform: 'uppercase',
          }}
        >
          Beta
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (prompt.trim()) handleParseAndExecute(prompt);
        }}
        style={{ display: 'flex', gap: '10px' }}
      >
        <input
          type="text"
          placeholder='e.g. "Free every Tue and Thu from 2pm to 4pm" or "Open Fridays 10am to 12pm"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            backgroundColor: 'white',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          style={{
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
          }}
        >
          {loading ? 'Scheduling...' : 'Apply ✨'}
        </button>
      </form>

      {/* Suggested Quick Prompts */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Try asking:</span>
        {samplePrompts.map((sample) => (
          <button
            key={sample}
            type="button"
            onClick={() => handleParseAndExecute(sample)}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '12px',
              color: '#4338ca',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            "{sample}"
          </button>
        ))}
      </div>

      {/* Feedback Message */}
      {message && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '500',
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#15803d' : '#dc2626',
            border: message.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
