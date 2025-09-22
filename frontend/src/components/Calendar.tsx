import { useEffect, useState } from 'react';
import {
  fetchWeekSlots,
  createSlot,
  updateSlotException,
  deleteSlotException,
} from '../api/slots';
import type { WeekSlotsResponse } from '../api/slots';
import SlotForm from './SlotForm';

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

  const loadSlots = () => {
    setLoading(true);
    fetchWeekSlots(weekDate)
      .then((data) => {
        setCalendar(data);
        setError(null);
      })
      .catch(() => setError('Failed to load slots'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSlots();
  }, [weekDate]);

  const days = calendar?.calendar ?? [];

  const prevWeek = () => {
    if (!calendar) return;
    const prevDate = new Date(calendar.weekStart);
    prevDate.setDate(prevDate.getDate() - 7);
    setWeekDate(prevDate.toISOString().slice(0, 10));
  };

  const nextWeek = () => {
    if (!calendar) return;
    const nextDate = new Date(calendar.weekStart);
    nextDate.setDate(nextDate.getDate() + 7);
    setWeekDate(nextDate.toISOString().slice(0, 10));
  };

  const onCreateSlot = async (startTime: string, endTime: string) => {
    if (addingForDay === null) return;
    try {
      await createSlot(addingForDay, startTime, endTime);
      setAddingForDay(null);
      loadSlots();
    } catch {
      alert('Failed to create slot');
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
    } catch {
      alert('Failed to update slot');
    }
  };

  const deleteSlot = async (slotId: number, date: string) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;
    try {
      await deleteSlotException(slotId, date);
      loadSlots();
    } catch {
      alert('Failed to delete slot');
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentMonth = new Date(weekDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0',
              marginBottom: '4px'
            }}>
              Your Schedule
            </h1>
            <div style={{
              fontSize: '16px',
              color: '#64748b',
              fontWeight: '500'
            }}>
              {currentMonth}
            </div>
          </div>
          
          <button 
            style={{
              backgroundColor: '#6366f1',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(99, 102, 241, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#4f46e5';
              target.style.transform = 'translateY(-1px)';
              target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#6366f1';
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 1px 3px rgba(99, 102, 241, 0.3)';
            }}
          >
            Save
          </button>
        </div>

        {/* Calendar Navigation */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          gap: '32px',
          backgroundColor: 'white',
          padding: '16px 24px',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <button
            onClick={prevWeek}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              fontSize: '20px',
              color: '#64748b',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                const target = e.target as HTMLButtonElement;
                target.style.backgroundColor = '#f1f5f9';
                target.style.color = '#1e293b';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                const target = e.target as HTMLButtonElement;
                target.style.backgroundColor = 'transparent';
                target.style.color = '#64748b';
              }
            }}
          >
            ‹
          </button>

          {/* Day Headers */}
          <div style={{ 
            display: 'flex', 
            gap: '24px',
            alignItems: 'center'
          }}>
            {dayNames.map((dayName, index) => {
              const dayData = days[index];
              const dayDate = dayData ? new Date(dayData.date) : null;
              const isToday = dayData && dayData.date === getFormattedToday();
              
              return (
                <div
                  key={dayName}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '60px'
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#64748b',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {dayName.charAt(0)}
                  </div>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '600',
                    backgroundColor: isToday ? '#6366f1' : 'transparent',
                    color: isToday ? 'white' : '#1e293b',
                    border: isToday ? 'none' : '2px solid transparent',
                    transition: 'all 0.2s ease'
                  }}>
                    {dayDate ? dayDate.getDate() : index + 1}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={nextWeek}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              fontSize: '20px',
              color: '#64748b',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                const target = e.target as HTMLButtonElement;
                target.style.backgroundColor = '#f1f5f9';
                target.style.color = '#1e293b';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                const target = e.target as HTMLButtonElement;
                target.style.backgroundColor = 'transparent';
                target.style.color = '#64748b';
              }
            }}
          >
            ›
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '40px 0' 
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#fef2f2',
            borderLeft: '4px solid #ef4444',
            color: '#dc2626',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        {/* Schedule List */}
        {!loading && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px' 
          }}>
            {days.map((day) => {
              const dayOfWeek = new Date(day.date).getDay();
              const isToday = day.date === getFormattedToday();
              const dayName = dayNames[dayOfWeek];
              const dayDate = new Date(day.date);
              
              return (
                <div key={day.date}>
                  {/* Day Label */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                    padding: '0 4px'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: isToday ? '#6366f1' : '#1e293b',
                      minWidth: '120px'
                    }}>
                      {dayName}, {String(dayDate.getDate()).padStart(2, '0')}
                    </div>
                    {isToday && (
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6366f1',
                        backgroundColor: '#ede9fe',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}>
                        Today
                      </div>
                    )}
                  </div>

                  {/* Time Slots */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px' 
                  }}>
                    {day.slots.length === 0 && addingForDay !== dayOfWeek && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: 'white',
                        padding: '20px 24px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#64748b'
                        }}>
                          00:00 - 00:00
                        </div>
                        <button
                          onClick={() => setAddingForDay(dayOfWeek)}
                          style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: '2px solid #e2e8f0',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#64748b',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            const target = e.target as HTMLButtonElement;
                            target.style.borderColor = '#6366f1';
                            target.style.color = '#6366f1';
                            target.style.backgroundColor = '#f8fafc';
                          }}
                          onMouseLeave={(e) => {
                            const target = e.target as HTMLButtonElement;
                            target.style.borderColor = '#e2e8f0';
                            target.style.color = '#64748b';
                            target.style.backgroundColor = 'transparent';
                          }}
                        >
                          +
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
                            padding: '20px 24px',
                            borderRadius: '12px',
                            border: '1px solid #eab308'
                          }}>
                            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
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
                              <span style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                color: '#64748b',
                                fontSize: '14px'
                              }}>
                                -
                              </span>
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
                                  borderRadius: '6px',
                                  padding: '8px 16px',
                                  fontSize: '12px',
                                  fontWeight: '500',
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
                                  borderRadius: '6px',
                                  padding: '8px 16px',
                                  fontSize: '12px',
                                  fontWeight: '500',
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
                            backgroundColor: slot.exception ? '#fefce8' : 'white',
                            padding: '20px 24px',
                            borderRadius: '12px',
                            border: slot.exception ? '1px solid #eab308' : '1px solid #e2e8f0'
                          }}>
                            <div style={{
                              fontSize: '14px',
                              color: '#1e293b',
                              fontWeight: '500'
                            }}>
                              {slot.start_time} - {slot.end_time}
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
                                  background: 'none',
                                  border: '2px solid #e2e8f0',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: '#64748b',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  const target = e.target as HTMLButtonElement;
                                  target.style.borderColor = '#6366f1';
                                  target.style.color = '#6366f1';
                                }}
                                onMouseLeave={(e) => {
                                  const target = e.target as HTMLButtonElement;
                                  target.style.borderColor = '#e2e8f0';
                                  target.style.color = '#64748b';
                                }}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteSlot(slot.id, day.date)}
                                style={{
                                  background: 'none',
                                  border: '2px solid #e2e8f0',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: '#64748b',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  const target = e.target as HTMLButtonElement;
                                  target.style.borderColor = '#ef4444';
                                  target.style.color = '#ef4444';
                                }}
                                onMouseLeave={(e) => {
                                  const target = e.target as HTMLButtonElement;
                                  target.style.borderColor = '#e2e8f0';
                                  target.style.color = '#64748b';
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add Slot Form */}
                    {addingForDay === dayOfWeek && (
                      <div style={{
                        backgroundColor: '#f0fdf4',
                        padding: '20px 24px',
                        borderRadius: '12px',
                        border: '1px solid #16a34a'
                      }}>
                        <SlotForm
                          dayOfWeek={dayOfWeek}
                          onSubmit={onCreateSlot}
                          onCancel={() => setAddingForDay(null)}
                        />
                      </div>
                    )}

                    {/* Add button for existing slots */}
                    {day.slots.length > 0 && day.slots.length < 2 && addingForDay !== dayOfWeek && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: 'white',
                        padding: '20px 24px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#64748b'
                        }}>
                          00:00 - 00:00
                        </div>
                        <button
                          onClick={() => setAddingForDay(dayOfWeek)}
                          style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: '2px solid #e2e8f0',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#64748b',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            const target = e.target as HTMLButtonElement;
                            target.style.borderColor = '#6366f1';
                            target.style.color = '#6366f1';
                            target.style.backgroundColor = '#f8fafc';
                          }}
                          onMouseLeave={(e) => {
                            const target = e.target as HTMLButtonElement;
                            target.style.borderColor = '#e2e8f0';
                            target.style.color = '#64748b';
                            target.style.backgroundColor = 'transparent';
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}