import React, { useState } from 'react';

interface SlotFormProps {
  dayOfWeek: number;
  onSubmit: (startTime: string, endTime: string) => void;
  onCancel: () => void;
}

export default function SlotForm({ onSubmit, onCancel }: SlotFormProps) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) return alert('Start and end times are required.');
    onSubmit(startTime, endTime);
  };

  return (
    <form onSubmit={handleSubmit} className="p-2 bg-gray-50 rounded border mt-2">
      <div>
        <label>Start Time: </label>
        <input
          type="time"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          required
          className="border p-1 rounded"
        />
      </div>

      <div className="mt-2">
        <label>End Time: </label>
        <input
          type="time"
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
          required
          className="border p-1 rounded"
        />
      </div>

      <div className="mt-2 space-x-2">
        <button type="submit" className="btn bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded">
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
