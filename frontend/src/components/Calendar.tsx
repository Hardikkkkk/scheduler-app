import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchWeekSlots,
  createSlot,
  updateSlotException,
  deleteSlotException,
  cancelBooking,
} from '../api/slots';
import type { WeekSlotsResponse } from '../api/slots';
import SlotForm from './SlotForm';
import Header from './Header';
import ClientBookingView from './ClientBookingView';
import TimeGridView from './TimeGridView';
import AiCommandBar from './AiCommandBar';
import GlassBackground from './GlassBackground';

const getFormattedToday = () => new Date().toISOString().slice(0, 10);

export default function Calendar() {
  const [weekDate, setWeekDate] = useState(getFormattedToday());
  const [calendar, setCalendar] = useState<WeekSlotsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingForDay, setAddingForDay] = useState<number | null>(null);
  const [editingSlot, setEditingSlot] = useState<{ id: number; date: string } | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  // Dual-mode & view switcher state
  const [currentView, setCurrentView] = useState<'host' | 'client'>('host');
  const [hostDisplayMode, setHostDisplayMode] = useState<'grid' | 'list'>('grid');
  const [timezone, setTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
  );

  const loadSlots = () => {
    setLoading(true);
    fetchWeekSlots(weekDate)
      .then((data) => {
        setCalendar(data);
        setError(null);
      })
      .catch((err) => setError(err.message || 'Failed to load slots'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSlots();
  }, [weekDate]);

  const days = calendar?.calendar ?? [];

  const shiftWeek = (baseDateStr: string, daysOffset: number) => {
    const [y, m, d] = baseDateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + daysOffset));
    return date.toISOString().slice(0, 10);
  };

  const prevWeek = () => {
    const base = calendar?.weekStart || weekDate;
    setWeekDate(shiftWeek(base, -7));
  };

  const nextWeek = () => {
    const base = calendar?.weekStart || weekDate;
    setWeekDate(shiftWeek(base, 7));
  };

  const onCreateSlot = async (startTime: string, endTime: string) => {
    if (addingForDay === null) return;
    try {
      await createSlot(addingForDay, startTime, endTime);
      setAddingForDay(null);
      loadSlots();
    } catch (err: any) {
      alert(err.message || 'Failed to create slot');
    }
  };

  const startEditSlot = (slotId: number, date: string, startTime: string, endTime: string) => {
    setEditingSlot({ id: slotId, date });
    setEditStartTime(startTime);
    setEditEndTime(endTime);
  };

  const cancelEdit = () => {
    setEditingSlot(null);
    setEditStartTime('');
    setEditEndTime('');
  };

  const saveEdit = async () => {
    if (!editingSlot) return;
    try {
      await updateSlotException(editingSlot.id, editingSlot.date, editStartTime, editEndTime);
      cancelEdit();
      loadSlots();
    } catch (err: any) {
      alert(err.message || 'Failed to update slot');
    }
  };

  const deleteSlot = async (slotId: number, date: string) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;
    try {
      await deleteSlotException(slotId, date);
      loadSlots();
    } catch (err: any) {
      alert(err.message || 'Failed to delete slot');
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Cancel this client booking?')) return;
    try {
      await cancelBooking(bookingId);
      loadSlots();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentMonth = new Date(weekDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Statistics
  const totalSlotsCount = days.reduce((acc, d) => acc + d.slots.length, 0);
  const totalBookingsCount = days.reduce((acc, d) => acc + (d.bookings?.length || 0), 0);
  const totalHours = days.reduce((acc, d) => {
    const daySlotHours = d.slots.reduce((subAcc, s) => {
      const [sh, sm] = s.start_time.split(':').map(Number);
      const [eh, em] = s.end_time.split(':').map(Number);
      return subAcc + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    }, 0);
    return acc + daySlotHours;
  }, 0);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Ambient React Bits Glass Background */}
      <GlassBackground />

      {/* Top Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        timezone={timezone}
        onTimezoneChange={setTimezone}
      />

      <main
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '36px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <AnimatePresence mode="wait">
          {currentView === 'client' ? (
            <motion.div
              key="client-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
            >
              <ClientBookingView
                calendar={calendar}
                weekDate={weekDate}
                onPrevWeek={prevWeek}
                onNextWeek={nextWeek}
                onBookingCreated={loadSlots}
                loading={loading}
              />
            </motion.div>
          ) : (
            <motion.div
              key="host-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              {/* Glass Header & Scorecard Bar */}
              <div
                className="glass-panel"
                style={{
                  padding: '28px 32px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '20px',
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: '26px',
                      fontWeight: '800',
                      color: '#0f172a',
                      margin: '0 0 4px 0',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    Host Dashboard
                  </h1>
                  <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                    Weekly Schedule &bull; {currentMonth} ({timezone.split('/')[1]?.replace('_', ' ') || timezone})
                  </div>
                </div>

                {/* Scorecard KPIs */}
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="glass-card"
                    style={{
                      padding: '12px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                      Available Windows
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                      {totalSlotsCount} slots ({totalHours.toFixed(1)}h)
                    </span>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="glass-card"
                    style={{
                      padding: '12px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid rgba(134, 239, 172, 0.7)',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase' }}>
                      Client Bookings
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#15803d' }}>
                      {totalBookingsCount} sessions
                    </span>
                  </motion.div>

                  {/* Display Mode Switcher */}
                  <div
                    className="glass-pill"
                    style={{
                      display: 'flex',
                      padding: '4px',
                      position: 'relative',
                    }}
                  >
                    <button
                      onClick={() => setHostDisplayMode('grid')}
                      style={{
                        position: 'relative',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        color: hostDisplayMode === 'grid' ? '#4f46e5' : '#64748b',
                        backgroundColor: 'transparent',
                        zIndex: 2,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {hostDisplayMode === 'grid' && (
                        <motion.div
                          layoutId="activeHostMode"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                            zIndex: -1,
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      📅 Time-Grid
                    </button>
                    <button
                      onClick={() => setHostDisplayMode('list')}
                      style={{
                        position: 'relative',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        color: hostDisplayMode === 'list' ? '#4f46e5' : '#64748b',
                        backgroundColor: 'transparent',
                        zIndex: 2,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {hostDisplayMode === 'list' && (
                        <motion.div
                          layoutId="activeHostMode"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                            zIndex: -1,
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      📋 List View
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Command Bar */}
              <AiCommandBar onSuccess={loadSlots} />

              {/* Calendar Navigation */}
              <div
                className="glass-panel"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 24px',
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={prevWeek}
                  disabled={loading}
                  className="glass-pill"
                  style={{
                    padding: '8px 18px',
                    fontSize: '13px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '700',
                    color: '#334155',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  ‹ Previous Week
                </motion.button>

                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                    {calendar?.weekStart} &bull; {calendar?.weekEnd}
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={nextWeek}
                  disabled={loading}
                  className="glass-pill"
                  style={{
                    padding: '8px 18px',
                    fontSize: '13px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '700',
                    color: '#334155',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Next Week ›
                </motion.button>
              </div>

              {/* Loading Spinner */}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '36px 0' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(226, 232, 240, 0.6)',
                      borderTopColor: '#4f46e5',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                </div>
              )}

              {/* Error Banner with Retry */}
              {error && (
                <div
                  className="glass-panel"
                  style={{
                    padding: '18px 24px',
                    backgroundColor: 'rgba(254, 242, 242, 0.85)',
                    borderLeft: '4px solid #ef4444',
                    color: '#b91c1c',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: '700' }}>{error}</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#991b1b' }}>
                      Note: If database is disconnected, update your connection string in Render.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={loadSlots}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    Retry
                  </motion.button>
                </div>
              )}

              {/* Interactive Time-Grid View */}
              {!loading && hostDisplayMode === 'grid' && (
                <TimeGridView
                  calendar={calendar}
                  onAddSlotForDay={(dayOfWeek) => setAddingForDay(dayOfWeek)}
                  onEditSlot={(slot, date) => startEditSlot(slot.id, date, slot.start_time, slot.end_time)}
                  onDeleteSlot={deleteSlot}
                  onCancelBooking={handleCancelBooking}
                />
              )}

              {/* Card List View */}
              {!loading && hostDisplayMode === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {days.map((day) => {
                    const dayOfWeek = new Date(day.date).getUTCDay();
                    const isToday = day.date === getFormattedToday();
                    const dayName = dayNames[dayOfWeek];
                    const dayDate = new Date(day.date);

                    return (
                      <motion.div
                        key={day.date}
                        className="glass-panel"
                        style={{ padding: '24px' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '16px',
                            paddingBottom: '12px',
                            borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '17px',
                              fontWeight: '800',
                              color: isToday ? '#4f46e5' : '#0f172a',
                              minWidth: '120px',
                            }}
                          >
                            {dayName}, {String(dayDate.getUTCDate()).padStart(2, '0')}
                          </div>
                          {isToday && (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: '800',
                                color: '#4f46e5',
                                backgroundColor: 'rgba(238, 242, 255, 0.8)',
                                padding: '3px 8px',
                                borderRadius: '8px',
                                textTransform: 'uppercase',
                              }}
                            >
                              Today
                            </span>
                          )}
                          <span style={{ fontSize: '13px', color: '#64748b', marginLeft: 'auto', fontWeight: '500' }}>
                            {day.slots.length} recurring slots &bull; {day.bookings?.length || 0} booked
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {day.slots.length === 0 && addingForDay !== dayOfWeek && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                backgroundColor: 'rgba(248, 250, 252, 0.6)',
                                padding: '16px 20px',
                                borderRadius: '14px',
                                border: '1px dashed #cbd5e1',
                              }}
                            >
                              <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>
                                No availability slots set for this day
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setAddingForDay(dayOfWeek)}
                                className="gradient-btn"
                                style={{
                                  marginLeft: 'auto',
                                  padding: '8px 16px',
                                  borderRadius: '10px',
                                  fontSize: '13px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                }}
                              >
                                + Add Slot
                              </motion.button>
                            </div>
                          )}

                          {day.slots.map((slot) => (
                            <div key={slot.id}>
                              {editingSlot &&
                              editingSlot.id === slot.id &&
                              editingSlot.date === day.date ? (
                                <div
                                  className="glass-card"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    backgroundColor: 'rgba(254, 252, 232, 0.9)',
                                    padding: '16px 20px',
                                    border: '1px solid #eab308',
                                  }}
                                >
                                  <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                                    <input
                                      type="time"
                                      value={editStartTime}
                                      onChange={(e) => setEditStartTime(e.target.value)}
                                      style={{
                                        border: '1px solid #d1d5db',
                                        padding: '8px 12px',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        backgroundColor: 'white',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                      }}
                                    />
                                    <span style={{ color: '#64748b' }}>to</span>
                                    <input
                                      type="time"
                                      value={editEndTime}
                                      onChange={(e) => setEditEndTime(e.target.value)}
                                      style={{
                                        border: '1px solid #d1d5db',
                                        padding: '8px 12px',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        backgroundColor: 'white',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                      }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      onClick={saveEdit}
                                      style={{
                                        background: '#22c55e',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        padding: '8px 16px',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      style={{
                                        background: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        padding: '8px 16px',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="glass-card"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '16px 20px',
                                    backgroundColor: slot.exception
                                      ? 'rgba(254, 252, 232, 0.9)'
                                      : 'rgba(255, 255, 255, 0.85)',
                                    border: slot.exception ? '1px solid #fde047' : '1px solid rgba(226, 232, 240, 0.8)',
                                  }}
                                >
                                  <span style={{ fontSize: '18px' }}>⏰</span>
                                  <div>
                                    <span
                                      style={{
                                        fontSize: '15px',
                                        color: '#0f172a',
                                        fontWeight: '800',
                                      }}
                                    >
                                      {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                                    </span>
                                    {slot.exception && (
                                      <span
                                        style={{
                                          marginLeft: '10px',
                                          fontSize: '11px',
                                          fontWeight: '800',
                                          color: '#854d0e',
                                          backgroundColor: '#fef08a',
                                          padding: '2px 8px',
                                          borderRadius: '10px',
                                        }}
                                      >
                                        Exception for {day.date}
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() =>
                                        startEditSlot(
                                          slot.id,
                                          day.date,
                                          slot.start_time,
                                          slot.end_time
                                        )
                                      }
                                      className="glass-pill"
                                      style={{
                                        padding: '6px 12px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        color: '#475569',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                      }}
                                    >
                                      ✏️ Edit
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => deleteSlot(slot.id, day.date)}
                                      className="glass-pill"
                                      style={{
                                        padding: '6px 12px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        color: '#dc2626',
                                        border: '1px solid #fee2e2',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                      }}
                                    >
                                      🗑️ Delete
                                    </motion.button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Confirmed Bookings Section */}
                          {day.bookings && day.bookings.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '800', color: '#166534', textTransform: 'uppercase' }}>
                                Confirmed Appointments
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                                {day.bookings.map((b) => (
                                  <div
                                    key={b.id}
                                    style={{
                                      backgroundColor: 'rgba(240, 253, 244, 0.85)',
                                      border: '1px solid #bbf7d0',
                                      padding: '12px 18px',
                                      borderRadius: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '12px',
                                    }}
                                  >
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#166534' }}>
                                          {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                                        </span>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                                          {b.client_name}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                                          ({b.client_email})
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px', fontWeight: '500' }}>
                                        📌 {b.meeting_title} {b.notes ? `• "${b.notes}"` : ''}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleCancelBooking(b.id)}
                                      style={{
                                        background: 'white',
                                        border: '1px solid #fca5a5',
                                        color: '#dc2626',
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Add Slot Form */}
                          {addingForDay === dayOfWeek && (
                            <div
                              style={{
                                backgroundColor: 'rgba(240, 253, 244, 0.9)',
                                padding: '20px 24px',
                                borderRadius: '14px',
                                border: '1px solid #16a34a',
                                marginTop: '8px',
                              }}
                            >
                              <SlotForm
                                dayOfWeek={dayOfWeek}
                                onSubmit={onCreateSlot}
                                onCancel={() => setAddingForDay(null)}
                              />
                            </div>
                          )}

                          {/* Add button for existing slots (< 2 per day) */}
                          {day.slots.length > 0 && day.slots.length < 2 && addingForDay !== dayOfWeek && (
                            <button
                              onClick={() => setAddingForDay(dayOfWeek)}
                              className="glass-pill"
                              style={{
                                alignSelf: 'flex-start',
                                padding: '8px 16px',
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#4f46e5',
                                cursor: 'pointer',
                                marginTop: '4px',
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                              }}
                            >
                              + Add 2nd Slot for {dayName}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Modal Slot Form for Time-Grid */}
              <AnimatePresence>
                {hostDisplayMode === 'grid' && addingForDay !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(12, 15, 29, 0.5)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 100,
                      padding: '16px',
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      className="glass-panel"
                      style={{
                        padding: '28px',
                        maxWidth: '480px',
                        width: '100%',
                      }}
                    >
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                        Add Availability Window for {dayNames[addingForDay]}
                      </h3>
                      <SlotForm
                        dayOfWeek={addingForDay}
                        onSubmit={onCreateSlot}
                        onCancel={() => setAddingForDay(null)}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
