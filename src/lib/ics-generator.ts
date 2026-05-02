import { format } from 'date-fns';

interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
}

export function generateICS(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  };

  const dtstamp = formatDate(new Date());
  const dtstart = formatDate(event.startDate);
  // Default to 1 hour duration if no end date provided
  const endDate = event.endDate || new Date(event.startDate.getTime() + 60 * 60 * 1000);
  const dtend = formatDate(endDate);

  const icsString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OdinTracker//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
END:VEVENT
END:VCALENDAR`;

  return icsString;
}

export function downloadICS(event: CalendarEvent, filename: string) {
  const icsData = generateICS(event);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
