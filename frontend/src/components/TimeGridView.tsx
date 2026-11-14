import { motion } from 'framer-motion';
import type { WeekSlotsResponse, Slot, Booking } from '../api/slots';

interface TimeGridViewProps {
  calendar: WeekSlotsResponse | null;
  onAddSlotForDay: (dayOfWeek: number, defaultStart?: string, defaultEnd?: string) => void;
  onEditSlot: (slot: Slot, date: string) => void;
  onDeleteSlot: (slotId: number, date: string) => void;
  onCancelBooking: (bookingId: number) => void;
}

const START_HOUR = 8;
const END_HOUR = 21;
const HOUR_HEIGHT = 68;

const timeToPixels = (timeStr: string) => {
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number);
  const minutesFromStart = (h - START_HOUR) * 60 + m;
  return (minutesFromStart / 60) * HOUR_HEIGHT;
};

const durationToPixels = (startStr: string, endStr: string) => {
  const [sh, sm] = startStr.slice(0, 5).split(':').map(Number);
  const [eh, em] = endStr.slice(0, 5).split(':').map(Number);
  const durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max((durationMinutes / 60) * HOUR_HEIGHT, 36);
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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel"
      style={{ overflow: 'hidden' }}
    >
      {/* Grid Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '70px repeat(7, 1fr)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.7)',
          backgroundColor: 'rgba(248, 250, 252, 0.7)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ padding: '16px 8px', borderRight: '1px solid rgba(226, 232, 240, 0.7)' }} />
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
                borderRight: '1px solid rgba(226, 232, 240, 0.6)',
                backgroundColor: isToday ? 'rgba(238, 242, 255, 0.6)' : 'transparent',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: isToday ? '#4f46e5' : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
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
                  borderRadius: '10px',
                  marginTop: '4px',
                  fontSize: '15px',
                  fontWeight: '800',
                  backgroundColor: isToday ? '#4f46e5' : 'transparent',
                  color: isToday ? 'white' : '#0f172a',
                  boxShadow: isToday ? '0 2px 8px rgba(79, 70, 229, 0.35)' : 'none',
                }}
              >
                {d}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Canvas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '70px repeat(7, 1fr)',
          position: 'relative',
          height: `${hours.length * HOUR_HEIGHT}px`,
        }}
      >
        {/* Time Labels Sidebar */}
        <div style={{ borderRight: '1px solid rgba(226, 232, 240, 0.7)', backgroundColor: 'rgba(248, 250, 252, 0.5)' }}>
          {hours.map((hour) => {
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;

            return (
              <div
                key={hour}
                style={{
                  height: `${HOUR_HEIGHT}px`,
                  boxSizing: 'border-box',
                  borderBottom: '1px solid rgba(241, 245, 249, 0.8)',
                  paddingRight: '10px',
                  textAlign: 'right',
                  fontSize: '11px',
                  fontWeight: '700',
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
                borderRight: '1px solid rgba(241, 245, 249, 0.8)',
                height: '100%',
              }}
            >
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
                    borderBottom: '1px solid rgba(241, 245, 249, 0.8)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = 'rgba(240, 253, 244, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                />
              ))}

              {/* Recurring Slots & Exceptions */}
              {day.slots.map((slot) => {
                const top = timeToPixels(slot.start_time);
                const height = durationToPixels(slot.start_time, slot.end_time);

                return (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    style={{
                      position: 'absolute',
                      top: `${top}px`,
                      left: '4px',
                      right: '4px',
                      height: `${height}px`,
                      backgroundColor: slot.exception ? 'rgba(254, 240, 138, 0.9)' : 'rgba(224, 231, 255, 0.9)',
                      border: slot.exception ? '1.5px solid #ca8a04' : '1.5px solid #6366f1',
                      borderRadius: '12px',
                      padding: '6px 8px',
                      boxSizing: 'border-box',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          color: slot.exception ? '#854d0e' : '#3730a3',
                          textTransform: 'uppercase',
                        }}
                      >
                        {slot.exception ? '⚡ Exception' : '🔄 Open Slot'}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: '800',
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
                          backgroundColor: 'rgba(255,255,255,0.85)',
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
                          backgroundColor: 'rgba(255,255,255,0.85)',
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
                  </motion.div>
                );
              })}

              {/* Booked Appointments */}
              {day.bookings?.map((b: Booking) => {
                const top = timeToPixels(b.start_time);
                const height = durationToPixels(b.start_time, b.end_time);

                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    style={{
                      position: 'absolute',
                      top: `${top}px`,
                      left: '6px',
                      right: '6px',
                      height: `${height}px`,
                      backgroundColor: 'rgba(34, 197, 94, 0.95)',
                      color: 'white',
                      border: '1.5px solid #16a34a',
                      borderRadius: '12px',
                      padding: '6px 8px',
                      boxSizing: 'border-box',
                      zIndex: 15,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', opacity: 0.95 }}>
                        👤 {b.client_name}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '800', marginTop: '1px' }}>
                        {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                      </div>
                      <div style={{ fontSize: '10px', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        color: 'white',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
