import { useState } from 'react';
import type { WeekSlotsResponse, Slot, Booking } from '../api/slots';
import { createBooking } from '../api/slots';
import { generateIcs, downloadIcsFile } from '../utils/ics';

interface ClientBookingViewProps {
  calendar: WeekSlotsResponse | null;
  weekDate: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onBookingCreated: () => void;
  loading: boolean;
}

// Convert "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr: string) => {
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};

// Convert minutes to "HH:MM"
const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Format "HH:MM" to 12-hour AM/PM format
const format12Hour = (timeStr: string) => {
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
};

export default function ClientBookingView({
  calendar,
  onPrevWeek,
  onNextWeek,
  onBookingCreated,
  loading,
}: ClientBookingViewProps) {
  const days = calendar?.calendar ?? [];
  const [selectedDate, setSelectedDate] = useState<string>(days[0]?.date || '');
  const [meetingDuration, setMeetingDuration] = useState<number>(30); // 15, 30, 45, 60 minutes
  const [selectedSlotTime, setSelectedSlotTime] = useState<{ start: string; end: string; slotId?: number } | null>(null);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [meetingTopic, setMeetingTopic] = useState('Product / Tech Discussion');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Find active day
  const activeDate = selectedDate || days[0]?.date || '';
  const activeDayData = days.find((d) => d.date === activeDate);
  const availableHostSlots = activeDayData?.slots ?? [];
  const dayBookings = activeDayData?.bookings ?? [];

  // Generate sub-slots based on meetingDuration
  const generateAvailableTimeSlots = (slots: Slot[], bookings: Booking[], duration: number) => {
    const candidateSlots: { start: string; end: string; slotId: number }[] = [];

    slots.forEach((slot) => {
      const slotStartMin = timeToMinutes(slot.start_time);
      const slotEndMin = timeToMinutes(slot.end_time);

      for (let time = slotStartMin; time + duration <= slotEndMin; time += duration) {
        const startStr = minutesToTime(time);
        const endStr = minutesToTime(time + duration);

        // Check if this window overlaps with any confirmed booking
        const isOverlap = bookings.some((b) => {
          const bStart = timeToMinutes(b.start_time);
          const bEnd = timeToMinutes(b.end_time);
          return time < bEnd && time + duration > bStart;
        });

        if (!isOverlap) {
          candidateSlots.push({
            start: startStr,
            end: endStr,
            slotId: slot.id,
          });
        }
      }
    });

    return candidateSlots;
  };

  const availableSlots = generateAvailableTimeSlots(availableHostSlots, dayBookings, meetingDuration);

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotTime || !activeDate || !clientName || !clientEmail) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newBooking = await createBooking({
        slot_id: selectedSlotTime.slotId,
        date: activeDate,
        start_time: selectedSlotTime.start,
        end_time: selectedSlotTime.end,
        client_name: clientName,
        client_email: clientEmail,
        meeting_title: meetingTopic,
        notes,
      });

      setConfirmedBooking(newBooking);
      onBookingCreated();
    } catch (err: any) {
      alert(err.message || 'Failed to complete booking. Please choose another slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCalendarInvite = () => {
    if (!confirmedBooking) return;
    const icsString = generateIcs({
      title: confirmedBooking.meeting_title,
      description: confirmedBooking.notes || 'Meeting with Hardik',
      date: confirmedBooking.date,
      startTime: confirmedBooking.start_time,
      endTime: confirmedBooking.end_time,
      attendeeName: confirmedBooking.client_name,
      attendeeEmail: confirmedBooking.client_email,
    });
    downloadIcsFile(`meeting-${confirmedBooking.date}.ics`, icsString);
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 16px' }}>
      {/* Host Bio Card */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '28px 32px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#4f46e5',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
          }}
        >
          H
        </div>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Hardik's Booking Link
            </h2>
            <span
              style={{
                backgroundColor: '#dcfce7',
                color: '#15803d',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Available
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Select an open slot to schedule a 1:1 mentorship session, tech consult, or project review.
          </p>
        </div>

        {/* Duration Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
            Session Length
          </span>
          <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
            {[15, 30, 45, 60].map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => {
                  setMeetingDuration(dur);
                  setSelectedSlotTime(null);
                }}
                style={{
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: meetingDuration === dur ? 'white' : 'transparent',
                  color: meetingDuration === dur ? '#4f46e5' : '#64748b',
                  boxShadow: meetingDuration === dur ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {dur}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Booking Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedSlotTime && !confirmedBooking ? '1fr 1fr' : '1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left / Main Column: Week Calendar & Slot Grid */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Week Navigator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Select Date & Time</span>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '2px 0 0 0' }}>
                {calendar?.weekStart} – {calendar?.weekEnd}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onPrevWeek}
                disabled={loading}
                style={{
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  color: '#334155',
                }}
              >
                ‹ Prev
              </button>
              <button
                onClick={onNextWeek}
                disabled={loading}
                style={{
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  color: '#334155',
                }}
              >
                Next ›
              </button>
            </div>
          </div>

          {/* Date Selector Ribbon */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            {days.map((day) => {
              const [y, m, d] = day.date.split('-').map(Number);
              const dayDate = new Date(Date.UTC(y, m - 1, d));
              const dayName = dayNames[dayDate.getUTCDay()];
              const isSelected = (selectedDate || days[0]?.date) === day.date;
              const hasSlots = day.slots.length > 0;

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day.date);
                    setSelectedSlotTime(null);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '12px 6px',
                    borderRadius: '14px',
                    border: isSelected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#eef2ff' : hasSlots ? '#f8fafc' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: '600', color: isSelected ? '#4f46e5' : '#64748b' }}>
                    {dayName}
                  </span>
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: isSelected ? '#4f46e5' : '#0f172a',
                      marginTop: '4px',
                    }}
                  >
                    {d}
                  </span>
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: hasSlots ? (isSelected ? '#4f46e5' : '#22c55e') : 'transparent',
                      marginTop: '6px',
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Slots Section for Selected Date */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                Open Windows ({availableSlots.length} available)
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Duration: {meetingDuration} mins</span>
            </div>

            {availableSlots.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '16px',
                  border: '1px dashed #cbd5e1',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>☕</div>
                <h4 style={{ margin: '0 0 4px 0', color: '#334155', fontWeight: '600' }}>No open slots on this day</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Please pick another day or switch session duration.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '10px',
                }}
              >
                {availableSlots.map((slot) => {
                  const isSlotSelected =
                    selectedSlotTime?.start === slot.start && selectedSlotTime?.end === slot.end;

                  return (
                    <button
                      key={`${slot.start}-${slot.end}`}
                      type="button"
                      onClick={() => setSelectedSlotTime(slot)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: isSlotSelected ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                        backgroundColor: isSlotSelected ? '#4f46e5' : 'white',
                        color: isSlotSelected ? 'white' : '#1e293b',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        boxShadow: isSlotSelected ? '0 4px 12px rgba(79, 70, 229, 0.3)' : '0 1px 2px rgba(0,0,0,0.04)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{format12Hour(slot.start)}</span>
                      <span style={{ fontSize: '11px', opacity: isSlotSelected ? 0.9 : 0.6 }}>
                        to {format12Hour(slot.end)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Booking Form */}
        {selectedSlotTime && !confirmedBooking && (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5', textTransform: 'uppercase' }}>
                Booking Summary
              </span>
              <h3 style={{ margin: '4px 0 2px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                {activeDate}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                {format12Hour(selectedSlotTime.start)} – {format12Hour(selectedSlotTime.end)} ({meetingDuration} min)
              </p>
            </div>

            <form onSubmit={handleBookSlot} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Smith"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Your Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Meeting Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Portfolio Review or Tech Consultation"
                  value={meetingTopic}
                  onChange={(e) => setMeetingTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Notes / Questions
                </label>
                <textarea
                  rows={3}
                  placeholder="Anything specific you'd like to prepare or discuss?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedSlotTime(null)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: 'white',
                    color: '#64748b',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  }}
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm Booking 🚀'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Celebration / Confirmed Booking Card */}
        {confirmedBooking && (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '36px 24px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
              border: '2px solid #86efac',
              textAlign: 'center',
              marginTop: '16px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#166534', margin: '0 0 8px 0' }}>
              Booking Confirmed!
            </h2>
            <p style={{ color: '#475569', fontSize: '15px', margin: '0 0 24px 0' }}>
              We've reserved this time slot for <strong>{confirmedBooking.client_name}</strong>.
            </p>

            <div
              style={{
                display: 'inline-block',
                textAlign: 'left',
                backgroundColor: '#f0fdf4',
                padding: '18px 24px',
                borderRadius: '14px',
                border: '1px solid #bbf7d0',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '14px', color: '#166534', fontWeight: '600', marginBottom: '4px' }}>
                📅 {confirmedBooking.date}
              </div>
              <div style={{ fontSize: '14px', color: '#166534', fontWeight: '600', marginBottom: '4px' }}>
                ⏰ {format12Hour(confirmedBooking.start_time)} – {format12Hour(confirmedBooking.end_time)}
              </div>
              <div style={{ fontSize: '14px', color: '#166534', fontWeight: '500' }}>
                📌 {confirmedBooking.meeting_title}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleDownloadCalendarInvite}
                style={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                }}
              >
                📥 Add to Calendar (.ics)
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmedBooking(null);
                  setSelectedSlotTime(null);
                  setClientName('');
                  setClientEmail('');
                  setNotes('');
                }}
                style={{
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Book Another Slot
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
