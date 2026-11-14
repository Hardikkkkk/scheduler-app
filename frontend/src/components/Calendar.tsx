import { useEffect, useState } from 'react';
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
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Top Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        timezone={timezone}
        onTimezoneChange={setTimezone}
      />

      <main style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>

        {/* Client View Mode */}
        {currentView === 'client' ? (
          <ClientBookingView
            calendar={calendar}
            weekDate={weekDate}
            onPrevWeek={prevWeek}
            onNextWeek={nextWeek}
            onBookingCreated={loadSlots}
            loading={loading}
          />
        ) : (
          /* Host Admin Mode */
          <>
            {/* Header & Scorecard Bar */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '20px',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  color: '#0f172a',
                  margin: '0',
                  marginBottom: '4px'
                }}>
                  Host Dashboard
                </h1>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b',
                  fontWeight: '500'
                }}>
                  Weekly Schedule &bull; {currentMonth} ({timezone.split('/')[1]?.replace('_', ' ') || timezone})
                </div>
              </div>

              {/* Scorecard KPIs */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{
                  backgroundColor: '#f1f5f9',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    Available Windows
                  </span>
                  <span style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                    {totalSlotsCount} slots ({totalHours.toFixed(1)}h)
                  </span>
                </div>

                <div style={{
                  backgroundColor: '#f0fdf4',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid #bbf7d0'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' }}>
                    Bookings
                  </span>
                  <span style={{ fontSize: '17px', fontWeight: '800', color: '#15803d' }}>
                    {totalBookingsCount} sessions
                  </span>
                </div>

                {/* Display Mode: Grid vs List */}
                <div style={{
                  display: 'flex',
                  backgroundColor: '#f1f5f9',
                  padding: '4px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <button
                    onClick={() => setHostDisplayMode('grid')}
                    style={{
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      backgroundColor: hostDisplayMode === 'grid' ? 'white' : 'transparent',
                      color: hostDisplayMode === 'grid' ? '#4f46e5' : '#64748b',
                      boxShadow: hostDisplayMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    📅 Time-Grid
                  </button>
                  <button
                    onClick={() => setHostDisplayMode('list')}
                    style={{
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      backgroundColor: hostDisplayMode === 'list' ? 'white' : 'transparent',
                      color: hostDisplayMode === 'list' ? '#4f46e5' : '#64748b',
                      boxShadow: hostDisplayMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    📋 List
                  </button>
                </div>
              </div>
            </div>

            {/* AI Command Bar Component */}
            <AiCommandBar onSuccess={loadSlots} />

            {/* Calendar Navigation Bar */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'white',
              padding: '16px 24px',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0'
            }}>
              <button
                onClick={prevWeek}
                disabled={loading}
                style={{
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  color: '#334155'
                }}
              >
                ‹ Previous Week
              </button>

              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                  {calendar?.weekStart} &bull; {calendar?.weekEnd}
                </span>
              </div>

              <button
                onClick={nextWeek}
                disabled={loading}
                style={{
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  color: '#334155'
                }}
              >
                Next Week ›
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid #e2e8f0',
                  borderTopColor: '#4f46e5',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              </div>
            )}

            {/* Error Banner with Retry */}
            {error && (
              <div style={{
                padding: '16px 20px',
                backgroundColor: '#fef2f2',
                borderLeft: '4px solid #ef4444',
                color: '#dc2626',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div>
                  <span>{error}</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#991b1b' }}>
                    Note: If database is disconnected, update your connection string in Render.
                  </p>
                </div>
                <button
                  onClick={loadSlots}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Mode 1: Interactive Time-Grid View */}
            {!loading && hostDisplayMode === 'grid' && (
              <TimeGridView
                calendar={calendar}
                onAddSlotForDay={(dayOfWeek) => setAddingForDay(dayOfWeek)}
                onEditSlot={(slot, date) => startEditSlot(slot.id, date, slot.start_time, slot.end_time)}
                onDeleteSlot={deleteSlot}
                onCancelBooking={handleCancelBooking}
              />
            )}

            {/* Mode 2: Card List View */}
            {!loading && hostDisplayMode === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {days.map((day) => {
                  const dayOfWeek = new Date(day.date).getUTCDay();
                  const isToday = day.date === getFormattedToday();
                  const dayName = dayNames[dayOfWeek];
                  const dayDate = new Date(day.date);
                  
                  return (
                    <div key={day.date} style={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '16px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid #f1f5f9'
                      }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: isToday ? '#4f46e5' : '#0f172a',
                          minWidth: '120px'
                        }}>
                          {dayName}, {String(dayDate.getUTCDate()).padStart(2, '0')}
                        </div>
                        {isToday && (
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '700',
                            color: '#4f46e5',
                            backgroundColor: '#eef2ff',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}>
                            Today
                          </div>
                        )}
                        <span style={{ fontSize: '13px', color: '#64748b', marginLeft: 'auto' }}>
                          {day.slots.length} recurring slots &bull; {day.bookings?.length || 0} booked
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {day.slots.length === 0 && addingForDay !== dayOfWeek && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            backgroundColor: '#f8fafc',
                            padding: '16px 20px',
                            borderRadius: '12px',
                            border: '1px dashed #cbd5e1'
                          }}>
                            <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                              No availability slots set for this day
                            </div>
                            <button
                              onClick={() => setAddingForDay(dayOfWeek)}
                              style={{
                                marginLeft: 'auto',
                                backgroundColor: '#4f46e5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 14px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              + Add Slot
                            </button>
                          </div>
                        )}

                        {day.slots.map((slot) => (
                          <div key={slot.id}>
                            {editingSlot &&
                            editingSlot.id === slot.id &&
                            editingSlot.date === day.date ? (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                backgroundColor: '#fefce8',
                                padding: '16px 20px',
                                borderRadius: '12px',
                                border: '1px solid #eab308'
                              }}>
                                <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                                  <input
                                    type="time"
                                    value={editStartTime}
                                    onChange={(e) => setEditStartTime(e.target.value)}
                                    style={{
                                      border: '1px solid #d1d5db',
                                      padding: '8px 12px',
                                      borderRadius: '8px',
                                      fontSize: '14px',
                                      outline: 'none',
                                      backgroundColor: 'white'
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
                                      borderRadius: '8px',
                                      fontSize: '14px',
                                      outline: 'none',
                                      backgroundColor: 'white'
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
                                      borderRadius: '8px',
                                      padding: '8px 16px',
                                      fontSize: '13px',
                                      fontWeight: '600',
                                      cursor: 'pointer'
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
                                      borderRadius: '8px',
                                      padding: '8px 16px',
                                      fontSize: '13px',
                                      fontWeight: '600',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                backgroundColor: slot.exception ? '#fefce8' : '#f8fafc',
                                padding: '16px 20px',
                                borderRadius: '12px',
                                border: slot.exception ? '1px solid #fde047' : '1px solid #e2e8f0'
                              }}>
                                <span style={{ fontSize: '18px' }}>⏰</span>
                                <div>
                                  <span style={{
                                    fontSize: '15px',
                                    color: '#0f172a',
                                    fontWeight: '700'
                                  }}>
                                    {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                                  </span>
                                  {slot.exception && (
                                    <span style={{
                                      marginLeft: '10px',
                                      fontSize: '11px',
                                      fontWeight: '700',
                                      color: '#854d0e',
                                      backgroundColor: '#fef08a',
                                      padding: '2px 8px',
                                      borderRadius: '10px'
                                    }}>
                                      Exception for {day.date}
                                    </span>
                                  )}
                                </div>
                                
                                <div style={{ 
                                  marginLeft: 'auto',
                                  display: 'flex',
                                  gap: '8px'
                                }}>
                                  <button
                                    onClick={() =>
                                      startEditSlot(
                                        slot.id,
                                        day.date,
                                        slot.start_time,
                                        slot.end_time
                                      )
                                    }
                                    style={{
                                      background: 'white',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '8px',
                                      padding: '6px 10px',
                                      cursor: 'pointer',
                                      fontSize: '13px',
                                      color: '#475569'
                                    }}
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => deleteSlot(slot.id, day.date)}
                                    style={{
                                      background: 'white',
                                      border: '1px solid #fee2e2',
                                      borderRadius: '8px',
                                      padding: '6px 10px',
                                      cursor: 'pointer',
                                      fontSize: '13px',
                                      color: '#dc2626'
                                    }}
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Confirmed Bookings Section */}
                        {day.bookings && day.bookings.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>
                              Client Appointments
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                              {day.bookings.map((b) => (
                                <div
                                  key={b.id}
                                  style={{
                                    backgroundColor: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px'
                                  }}
                                >
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>
                                        {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                                      </span>
                                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                                        {b.client_name}
                                      </span>
                                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                                        ({b.client_email})
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>
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
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add Slot Modal / Inline Form */}
                        {addingForDay === dayOfWeek && (
                          <div style={{
                            backgroundColor: '#f0fdf4',
                            padding: '20px 24px',
                            borderRadius: '12px',
                            border: '1px solid #16a34a',
                            marginTop: '8px'
                          }}>
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
                            style={{
                              alignSelf: 'flex-start',
                              backgroundColor: 'white',
                              border: '1px dashed #cbd5e1',
                              borderRadius: '8px',
                              padding: '8px 14px',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#4f46e5',
                              cursor: 'pointer',
                              marginTop: '4px'
                            }}
                          >
                            + Add 2nd Slot for {dayName}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Modal Slot Form for Time-Grid */}
            {hostDisplayMode === 'grid' && addingForDay !== null && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.4)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 100,
                  padding: '16px'
                }}
              >
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '18px',
                  padding: '24px',
                  maxWidth: '480px',
                  width: '100%',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                    Add Availability Window for {dayNames[addingForDay]}
                  </h3>
                  <SlotForm
                    dayOfWeek={addingForDay}
                    onSubmit={onCreateSlot}
                    onCancel={() => setAddingForDay(null)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
