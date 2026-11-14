import type { WeekSlotsResponse, Slot, Booking } from '../api/slots';

interface TimeGridViewProps {
  calendar: WeekSlotsResponse | null;
  onAddSlotForDay: (dayOfWeek: number, defaultStart?: string, defaultEnd?: string) => void;
  onEditSlot: (slot: Slot, date: string) => void;
  onDeleteSlot: (slotId: number, date: string) => void;
  onCancelBooking: (bookingId: number) => void;
}

const START_HOUR = 8; // 8:00 AM
const END_HOUR = 21; // 9:00 PM
const HOUR_HEIGHT = 64; // pixels per hour

// Convert "HH:MM" to offset in pixels from START_HOUR
const timeToPixels = (timeStr: string) => {
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number);
  const minutesFromStart = (h - START_HOUR) * 60 + m;
  return (minutesFromStart / 60) * HOUR_HEIGHT;
};

// Calculate block height in pixels
const durationToPixels = (startStr: string, endStr: string) => {
  const [sh, sm] = startStr.slice(0, 5).split(':').map(Number);
  const [eh, em] = endStr.slice(0, 5).split(':').map(Number);
  const durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max((durationMinutes / 60) * HOUR_HEIGHT, 32);
};

export default function TimeGridView({
  calendar,
  onAddSlotForDay,
  onEditSlot,
  onDeleteSlot,
  onCancelBooking,
}: TimeGridViewProps) {
  const days = calendar?.calendar ?? [];
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
      }}
    >
      {/* Grid Header (Days) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '70px repeat(7, 1fr)',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ padding: '16px 8px', borderRight: '1px solid #e2e8f0' }} />
        {days.map((day) => {
          const [y, m, d] = day.date.split('-').map(Number);
          const dateObj = new Date(Date.UTC(y, m - 1, d));
          const dayName = dayNames[dateObj.getUTCDay()];
          const isToday = day.date === todayStr;

          return (
            <div
              key={day.date}
              style={{
                padding: '14px 8px',
                textAlign: 'center',
                borderRight: '1px solid #e2e8f0',
                backgroundColor: isToday ? '#eff6ff' : 'transparent',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: isToday ? '#2563eb' : '#64748b',
                  textTransform: 'uppercase',
                }}
              >
                {dayName}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  marginTop: '4px',
                  fontSize: '15px',
                  fontWeight: '700',
                  backgroundColor: isToday ? '#2563eb' : 'transparent',
                  color: isToday ? 'white' : '#0f172a',
                }}
              >
                {d}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Canvas (Hours x Days) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '70px repeat(7, 1fr)',
          position: 'relative',
          height: `${hours.length * HOUR_HEIGHT}px`,
        }}
      >
        {/* Time Sidebar */}
        <div style={{ borderRight: '1px solid #e2e8f0', backgroundColor: '#fafafa' }}>
          {hours.map((hour) => {
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;

            return (
              <div
                key={hour}
                style={{
                  height: `${HOUR_HEIGHT}px`,
                  boxSizing: 'border-box',
                  borderBottom: '1px solid #f1f5f9',
                  paddingRight: '10px',
                  textAlign: 'right',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#94a3b8',
                  transform: 'translateY(-8px)',
                }}
              >
                {displayHour} {period}
              </div>
            );
          })}
        </div>

        {/* 7 Day Columns */}
        {days.map((day) => {
          const dayOfWeek = new Date(day.date).getUTCDay();

          return (
            <div
              key={day.date}
              style={{
                position: 'relative',
                borderRight: '1px solid #f1f5f9',
                height: '100%',
              }}
            >
              {/* Hour Grid Lines */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  onClick={() => {
                    const hStr = String(hour).padStart(2, '0');
                    const nextHStr = String(hour + 1).padStart(2, '0');
                    onAddSlotForDay(dayOfWeek, `${hStr}:00`, `${nextHStr}:00`);
                  }}
                  title="Click to add slot at this time"
                  style={{
                    height: `${HOUR_HEIGHT}px`,
                    boxSizing: 'border-box',
                    borderBottom: '1px solid #f8fafc',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = '#f0fdf4';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                />
              ))}

              {/* Recurring Slots & Exceptions Blocks */}
              {day.slots.map((slot) => {
                const top = timeToPixels(slot.start_time);
                const height = durationToPixels(slot.start_time, slot.end_time);

                return (
                  <div
                    key={slot.id}
                    style={{
                      position: 'absolute',
                      top: `${top}px`,
                      left: '4px',
                      right: '4px',
                      height: `${height}px`,
                      backgroundColor: slot.exception ? '#fef08a' : '#e0e7ff',
                      border: slot.exception ? '2px solid #ca8a04' : '2px solid #6366f1',
                      borderRadius: '10px',
                      padding: '6px 8px',
                      boxSizing: 'border-box',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: slot.exception ? '#854d0e' : '#3730a3',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>{slot.exception ? '⚡ Exception' : '🔄 Available Slot'}</span>
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#0f172a',
                          marginTop: '2px',
                        }}
                      >
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditSlot(slot, day.date);
                        }}
                        style={{
                          border: 'none',
                          backgroundColor: 'rgba(255,255,255,0.8)',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSlot(slot.id, day.date);
                        }}
                        style={{
                          border: 'none',
                          backgroundColor: 'rgba(255,255,255,0.8)',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          color: '#dc2626',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Booked Appointments Overlay Blocks */}
              {day.bookings?.map((b: Booking) => {
                const top = timeToPixels(b.start_time);
                const height = durationToPixels(b.start_time, b.end_time);

                return (
                  <div
                    key={b.id}
                    style={{
                      position: 'absolute',
                      top: `${top}px`,
                      left: '8px',
                      right: '8px',
                      height: `${height}px`,
                      backgroundColor: '#22c55e',
                      color: 'white',
                      border: '2px solid #16a34a',
                      borderRadius: '10px',
                      padding: '6px 8px',
                      boxSizing: 'border-box',
                      zIndex: 15,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.35)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', opacity: 0.9 }}>
                        👤 {b.client_name}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '1px' }}>
                        {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                      </div>
                      <div style={{ fontSize: '10px', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.meeting_title}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelBooking(b.id);
                      }}
                      style={{
                        alignSelf: 'flex-end',
                        border: 'none',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        color: 'white',
                        borderRadius: '4px',
                        padding: '1px 5px',
                        fontSize: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
