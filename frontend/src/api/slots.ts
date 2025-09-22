const API_BASE_URL = 'http://localhost:3001'; // Change to your backend URL if deployed

export interface Slot {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  exception: boolean;
}

export interface DailySlots {
  date: string;
  slots: Slot[];
}

export interface WeekSlotsResponse {
  weekStart: string;
  weekEnd: string;
  calendar: DailySlots[];
}

// Fetch slots for a given week (date string in YYYY-MM-DD)
export async function fetchWeekSlots(weekDate: string): Promise<WeekSlotsResponse> {
  const url = `${API_BASE_URL}/slots?week=${weekDate}`;
  console.log('Fetching slots from:', url);
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Error fetching slots:', res.status, res.statusText);
    throw new Error('Failed to fetch week slots');
  }
  return res.json();
}


// Create a new recurring slot
export async function createSlot(day_of_week: number, start_time: string, end_time: string) {
  const res = await fetch(`${API_BASE_URL}/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day_of_week, start_time, end_time }),
  });
  if (!res.ok) throw new Error('Failed to create slot');
  return res.json();
}

// Update a slot exception
export async function updateSlotException(id: number, date: string, new_start_time: string, new_end_time: string) {
  const res = await fetch(`${API_BASE_URL}/slots/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, new_start_time, new_end_time }),
  });
  if (!res.ok) throw new Error('Failed to update slot');
  return res.json();
}

// Delete a slot exception
export async function deleteSlotException(slot_id: number, date: string) {
  const res = await fetch(`${API_BASE_URL}/slots/${slot_id}?date=${date}`, {
    method: 'DELETE',
  });
  console.log('Delete response:', res.status);
  if (!res.ok) throw new Error('Failed to delete slot');
  return res.json();
}


