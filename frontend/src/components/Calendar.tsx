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
      {/* Ambient React Bits Aurora Background */}
      <GlassBackground />

      {/* Top Frosted Glass Header */}
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
                      color: '#f8fafc',
                      margin: '0 0 4px 0',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    Host Dashboard
                  </h1>
                  <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>
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
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Available Windows
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
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
                      border: '1px solid rgba(134, 239, 172, 0.4)',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#4ade80', textTransform: 'uppercase' }}>
                      Client Bookings
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#22c55e' }}>
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
                        color: hostDisplayMode === 'grid' ? '#ffffff' : '#94a3b8',
                        backgroundColor: 'transparent',
                        zIndex: 2,
                      }}
                    >
                      {hostDisplayMode === 'grid' && (
                        <motion.div
                          layoutId="activeHostMode"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.16)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '10px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
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
                        color: hostDisplayMode === 'list' ? '#ffffff' : '#94a3b8',
                        backgroundColor: 'transparent',
                        zIndex: 2,
                      }}
                    >
                      {hostDisplayMode === 'list' && (
                        <motion.div
                          layoutId="activeHostMode"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.16)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '10px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
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

              {/* AI Natural Language Command Bar */}
              <AiCommandBar onSuccess={loadSlots} />

              {/* Transparent Glass Calendar Navigation */}
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
                    color: '#e2e8f0',
                  }}
                >
                  ‹ Previous Week
                </motion.button>

                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc' }}>
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
                    color: '#e2e8f0',
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
                      border: '3px solid rgba(255, 255, 255, 0.15)',
                      borderTopColor: '#818cf8',
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
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    borderLeft: '4px solid #ef4444',
                    color: '#fca5a5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: '700' }}>{error}</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#f87171' }}>
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

              {/* Transparent Glass Card List View */}
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
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '17px',
                              fontWeight: '800',
                              color: isToday ? '#a5b4fc' : '#f8fafc',
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
                                color: '#c7d2fe',
                                backgroundColor: 'rgba(99, 102, 241, 0.25)',
                                border: '1px solid rgba(165, 180, 252, 0.3)',
                                padding: '3px 8px',
                                borderRadius: '8px',
                                textTransform: 'uppercase',
                              }}
                            >
                              Today
                            </span>
                          )}
                          <span style={{ fontSize: '13px', color: '#94a3b8', marginLeft: 'auto', fontWeight: '500' }}>
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
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                padding: '16px 20px',
                                borderRadius: '14px',
                                border: '1px dashed rgba(255, 255, 255, 0.15)',
                              }}
                            >
                              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
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
                                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                    padding: '16px 20px',
                                    border: '1px solid rgba(234, 179, 8, 0.4)',
                                  }}
                                >
                                  <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                                    <input
                                      type="time"
                                      value={editStartTime}
                                      onChange={(e) => setEditStartTime(e.target.value)}
                                      className="glass-input"
                                      style={{ padding: '8px 12px', fontSize: '14px' }}
                                    />
                                    <span style={{ color: '#94a3b8' }}>to</span>
                                    <input
                                      type="time"
                                      value={editEndTime}
                                      onChange={(e) => setEditEndTime(e.target.value)}
                                      className="glass-input"
                                      style={{ padding: '8px 12px', fontSize: '14px' }}
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
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      style={{
                                        background: 'rgba(255, 255, 255, 0.12)',
                                        color: '#cbd5e1',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '10px',
                                        padding: '8px 16px',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
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
                                      ? 'rgba(234, 179, 8, 0.08)'
                                      : 'rgba(255, 255, 255, 0.05)',
                                    border: slot.exception
                                      ? '1px solid rgba(234, 179, 8, 0.35)'
                                      : '1px solid rgba(255, 255, 255, 0.1)',
                                  }}
                                >
                                  <span style={{ fontSize: '18px' }}>⏰</span>
                                  <div>
                                    <span
                                      style={{
                                        fontSize: '15px',
                                        color: '#f8fafc',
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
                                          color: '#fde047',
                                          backgroundColor: 'rgba(234, 179, 8, 0.2)',
                                          border: '1px solid rgba(234, 179, 8, 0.3)',
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
                                        color: '#e2e8f0',
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
                                        color: '#f87171',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
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
                              <span style={{ fontSize: '11px', fontWeight: '800', color: '#4ade80', textTransform: 'uppercase' }}>
                                Confirmed Appointments
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                                {day.bookings.map((b) => (
                                  <div
                                    key={b.id}
                                    style={{
                                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                      border: '1px solid rgba(34, 197, 94, 0.3)',
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
                                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#4ade80' }}>
                                          {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                                        </span>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
                                          {b.client_name}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                          ({b.client_email})
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '12px', color: '#86efac', marginTop: '2px', fontWeight: '500' }}>
                                        📌 {b.meeting_title} {b.notes ? `• "${b.notes}"` : ''}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleCancelBooking(b.id)}
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        border: '1px solid rgba(239, 68, 68, 0.35)',
                                        color: '#f87171',
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
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
                                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                                padding: '20px 24px',
                                borderRadius: '16px',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
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
                                color: '#a5b4fc',
                                cursor: 'pointer',
                                marginTop: '4px',
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
                      backgroundColor: 'rgba(9, 13, 22, 0.65)',
                      backdropFilter: 'blur(16px)',
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
                        padding: '32px',
                        maxWidth: '500px',
                        width: '100%',
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      }}
                    >
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '19px', fontWeight: '800', color: '#f8fafc' }}>
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
