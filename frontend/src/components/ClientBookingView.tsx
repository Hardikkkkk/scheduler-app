import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const timeToMinutes = (timeStr: string) => {
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

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
  const [meetingDuration, setMeetingDuration] = useState<number>(30);
  const [selectedSlotTime, setSelectedSlotTime] = useState<{ start: string; end: string; slotId?: number } | null>(null);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [meetingTopic, setMeetingTopic] = useState('Tech Mentorship & Project Review');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const activeDate = selectedDate || days[0]?.date || '';
  const activeDayData = days.find((d) => d.date === activeDate);
  const availableHostSlots = activeDayData?.slots ?? [];
  const dayBookings = activeDayData?.bookings ?? [];

  const generateAvailableTimeSlots = (slots: Slot[], bookings: Booking[], duration: number) => {
    const candidateSlots: { start: string; end: string; slotId: number }[] = [];

    slots.forEach((slot) => {
      const slotStartMin = timeToMinutes(slot.start_time);
      const slotEndMin = timeToMinutes(slot.end_time);

      for (let time = slotStartMin; time + duration <= slotEndMin; time += duration) {
        const startStr = minutesToTime(time);
        const endStr = minutesToTime(time + duration);

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
      alert(err.message || 'Failed to complete booking.');
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}
    >
      {/* Host Bio Glass Card */}
      <div
        className="glass-panel"
        style={{
          padding: '28px 32px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
        }}
      >
        <motion.div
          whileHover={{ scale: 1.08, rotate: -4 }}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            fontWeight: '800',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.35)',
          }}
        >
          H
        </motion.div>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Hardik's Calendar
            </h2>
            <span
              style={{
                backgroundColor: '#dcfce7',
                color: '#15803d',
                fontSize: '11px',
                fontWeight: '800',
                padding: '3px 10px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '0 1px 3px rgba(22, 163, 74, 0.15)',
              }}
            >
              ● Accepting Bookings
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0, fontWeight: '500' }}>
            Select an open slot to schedule a 1:1 mentorship session, tech consult, or project review.
          </p>
        </div>

        {/* Duration Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            Session Length
          </span>
          <div className="glass-pill" style={{ display: 'flex', gap: '4px', padding: '4px' }}>
            {[15, 30, 45, 60].map((dur) => (
              <motion.button
                key={dur}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  setMeetingDuration(dur);
                  setSelectedSlotTime(null);
                }}
                style={{
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: meetingDuration === dur ? '#4f46e5' : 'transparent',
                  color: meetingDuration === dur ? 'white' : '#64748b',
                  boxShadow: meetingDuration === dur ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none',
                  transition: 'all 0.15s ease',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {dur}m
              </motion.button>
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
        {/* Left Column: Week Ribbon & Slots */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          {/* Week Navigator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                Select Date & Time
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>
                {calendar?.weekStart} – {calendar?.weekEnd}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPrevWeek}
                disabled={loading}
                className="glass-pill"
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  color: '#334155',
                }}
              >
                ‹ Prev
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNextWeek}
                disabled={loading}
                className="glass-pill"
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  color: '#334155',
                }}
              >
                Next ›
              </motion.button>
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
              borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
            }}
          >
            {days.map((day) => {
              const [y, m, d] = day.date.split('-').map(Number);
              const dayDate = new Date(Date.UTC(y, m - 1, d));
              const dayName = dayNames[dayDate.getUTCDay()];
              const isSelected = (selectedDate || days[0]?.date) === day.date;
              const hasSlots = day.slots.length > 0;

              return (
                <motion.button
                  key={day.date}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
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
                    borderRadius: '16px',
                    border: isSelected ? '2px solid #4f46e5' : '1px solid rgba(226, 232, 240, 0.8)',
                    backgroundColor: isSelected ? 'rgba(238, 242, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 14px rgba(79, 70, 229, 0.2)' : 'none',
                    transition: 'all 0.15s ease',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: '700', color: isSelected ? '#4f46e5' : '#64748b' }}>
                    {dayName}
                  </span>
                  <span
                    style={{
                      fontSize: '17px',
                      fontWeight: '800',
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
                </motion.button>
              );
            })}
          </div>

          {/* Slots Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                Open Windows ({availableSlots.length} available)
              </span>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                Duration: {meetingDuration} mins
              </span>
            </div>

            {availableSlots.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 16px',
                  backgroundColor: 'rgba(248, 250, 252, 0.6)',
                  borderRadius: '16px',
                  border: '1px dashed #cbd5e1',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>☕</div>
                <h4 style={{ margin: '0 0 4px 0', color: '#334155', fontWeight: '700' }}>No open slots on this day</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Please pick another day or switch session duration.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '12px',
                }}
              >
                {availableSlots.map((slot) => {
                  const isSlotSelected =
                    selectedSlotTime?.start === slot.start && selectedSlotTime?.end === slot.end;

                  return (
                    <motion.button
                      key={`${slot.start}-${slot.end}`}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={() => setSelectedSlotTime(slot)}
                      style={{
                        padding: '14px 12px',
                        borderRadius: '14px',
                        border: isSlotSelected ? '2px solid #4f46e5' : '1px solid rgba(226, 232, 240, 0.9)',
                        backgroundColor: isSlotSelected ? '#4f46e5' : 'rgba(255, 255, 255, 0.85)',
                        color: isSlotSelected ? 'white' : '#1e293b',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '3px',
                        boxShadow: isSlotSelected
                          ? '0 6px 18px rgba(79, 70, 229, 0.35)'
                          : '0 2px 6px rgba(0,0,0,0.03)',
                        transition: 'all 0.15s ease',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      <span>{format12Hour(slot.start)}</span>
                      <span style={{ fontSize: '11px', opacity: isSlotSelected ? 0.9 : 0.6, fontWeight: '500' }}>
                        to {format12Hour(slot.end)}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Booking Form */}
        <AnimatePresence>
          {selectedSlotTime && !confirmedBooking && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="glass-panel"
              style={{ padding: '28px' }}
            >
              <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(226, 232, 240, 0.6)' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase' }}>
                  Booking Summary
                </span>
                <h3 style={{ margin: '4px 0 2px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                  {activeDate}
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
                  {format12Hour(selectedSlotTime.start)} – {format12Hour(selectedSlotTime.end)} ({meetingDuration} min)
                </p>
              </div>

              <form onSubmit={handleBookSlot} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
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
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      boxSizing: 'border-box',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
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
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      boxSizing: 'border-box',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Meeting Topic
                  </label>
                  <input
                    type="text"
                    value={meetingTopic}
                    onChange={(e) => setMeetingTopic(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      boxSizing: 'border-box',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Notes / Preparation
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Anything specific you'd like to prepare or discuss?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
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
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: 'white',
                      color: '#64748b',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="gradient-btn"
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: '12px',
                      fontWeight: '700',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {isSubmitting ? 'Confirming...' : 'Confirm Booking 🚀'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmed Booking Modal (Confetti Glass Card) */}
        <AnimatePresence>
          {confirmedBooking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel"
              style={{
                padding: '40px 28px',
                border: '2px solid rgba(134, 239, 172, 0.8)',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(22, 163, 74, 0.15)',
              }}
            >
              <div style={{ fontSize: '54px', marginBottom: '12px' }}>🎉</div>
              <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#166534', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                Booking Confirmed!
              </h2>
              <p style={{ color: '#475569', fontSize: '15px', margin: '0 0 24px 0', fontWeight: '500' }}>
                We've reserved this time slot for <strong>{confirmedBooking.client_name}</strong>.
              </p>

              <div
                style={{
                  display: 'inline-block',
                  textAlign: 'left',
                  backgroundColor: 'rgba(240, 253, 244, 0.8)',
                  padding: '20px 28px',
                  borderRadius: '16px',
                  border: '1px solid #bbf7d0',
                  marginBottom: '28px',
                }}
              >
                <div style={{ fontSize: '15px', color: '#166534', fontWeight: '700', marginBottom: '6px' }}>
                  📅 {confirmedBooking.date}
                </div>
                <div style={{ fontSize: '15px', color: '#166534', fontWeight: '700', marginBottom: '6px' }}>
                  ⏰ {format12Hour(confirmedBooking.start_time)} – {format12Hour(confirmedBooking.end_time)}
                </div>
                <div style={{ fontSize: '14px', color: '#166534', fontWeight: '600' }}>
                  📌 {confirmedBooking.meeting_title}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={handleDownloadCalendarInvite}
                  style={{
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 18px rgba(22, 163, 74, 0.35)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  📥 Add to Calendar (.ics)
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => {
                    setConfirmedBooking(null);
                    setSelectedSlotTime(null);
                    setClientName('');
                    setClientEmail('');
                    setNotes('');
                  }}
                  className="glass-pill"
                  style={{
                    padding: '14px 24px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    color: '#334155',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Book Another Slot
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
