/**
 * Generates an iCalendar (.ics) string for a meeting booking.
 */
export function generateIcs({
  title,
  description,
  date,
  startTime,
  endTime,
  organizerName = 'Hardik',
  organizerEmail = 'host@example.com',
  attendeeName,
  attendeeEmail,
}: {
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM or HH:MM:SS
  endTime: string; // HH:MM or HH:MM:SS
  organizerName?: string;
  organizerEmail?: string;
  attendeeName: string;
  attendeeEmail: string;
}): string {
  const cleanDate = date.replace(/-/g, '');
  const cleanStart = startTime.slice(0, 5).replace(/:/g, '') + '00';
  const cleanEnd = endTime.slice(0, 5).replace(/:/g, '') + '00';

  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}@schedulify.app`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Schedulify//Meeting Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${cleanDate}T${cleanStart}`,
    `DTEND:${cleanDate}T${cleanEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description ? description.replace(/\n/g, '\\n') : 'Meeting scheduled via Orbit Scheduler'}`,
    `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${attendeeName}:mailto:${attendeeEmail}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Triggers a browser download of the generated .ics calendar invite.
 */
export function downloadIcsFile(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
