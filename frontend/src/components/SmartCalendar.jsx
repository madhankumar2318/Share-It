import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ShieldCheck, AlertCircle, RotateCcw } from 'lucide-react';

/**
 * Formats a Date object to YYYY-MM-DD in local time
 */
const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Checks if a given date string falls within [startDate, endDate] inclusive
 */
const isDateInRange = (dateStr, startStr, endStr) => {
  return dateStr >= startStr && dateStr <= endStr;
};

const SmartCalendar = ({
  bookedRanges = [],
  startDate = '',
  endDate = '',
  onSelectRange,
}) => {
  // Current view month/year
  const todayStr = useMemo(() => formatDate(new Date()), []);
  const [viewDate, setViewDate] = useState(() => {
    if (startDate) {
      const parts = startDate.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [conflictNotice, setConflictNotice] = useState('');

  // Move month
  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Check if a date string is inside any booked range
  const getBookedInfo = (dateStr) => {
    for (const range of bookedRanges) {
      if (dateStr >= range.startDate && dateStr <= range.endDate) {
        return range;
      }
    }
    return null;
  };

  // Check if any date in range [start, end] is booked
  const rangeHasConflict = (startStr, endStr) => {
    if (!startStr || !endStr) return false;
    for (const range of bookedRanges) {
      // Overlap: range.startDate <= endStr && range.endDate >= startStr
      if (range.startDate <= endStr && range.endDate >= startStr) {
        return range;
      }
    }
    return false;
  };

  // Generate calendar days for current month view
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const days = [];
  // Empty slots for previous month padding
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({ empty: true, key: `empty-${i}` });
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const dObj = new Date(currentYear, currentMonth, d);
    const dateStr = formatDate(dObj);
    const booked = getBookedInfo(dateStr);
    const isPast = dateStr < todayStr;
    const isToday = dateStr === todayStr;
    const isStart = startDate === dateStr;
    const isEnd = endDate === dateStr;
    const isInRange = startDate && endDate && isDateInRange(dateStr, startDate, endDate);

    days.push({
      empty: false,
      dayNum: d,
      dateStr,
      isPast,
      isToday,
      booked,
      isStart,
      isEnd,
      isInRange,
      key: dateStr,
    });
  }

  const handleDayClick = (day) => {
    if (day.empty || day.isPast || day.booked) return;
    setConflictNotice('');

    if (!startDate || (startDate && endDate)) {
      // Step 1: Start fresh selection
      onSelectRange({ startDate: day.dateStr, endDate: '' });
    } else if (startDate && !endDate) {
      // Step 2: Selecting end date
      if (day.dateStr < startDate) {
        // Clicked date is earlier than start: restart with this as new start
        onSelectRange({ startDate: day.dateStr, endDate: '' });
      } else if (day.dateStr === startDate) {
        // Single-day borrow
        onSelectRange({ startDate: day.dateStr, endDate: day.dateStr });
      } else {
        // Check for any booked dates between startDate and clicked date
        const conflict = rangeHasConflict(startDate, day.dateStr);
        if (conflict) {
          setConflictNotice(
            `Cannot book across reserved dates (${conflict.startDate} to ${conflict.endDate}). Please select available dates.`
          );
          return;
        }
        onSelectRange({ startDate, endDate: day.dateStr });
      }
    }
  };

  const handleClearSelection = () => {
    setConflictNotice('');
    onSelectRange({ startDate: '', endDate: '' });
  };

  // Compute number of days selected
  const selectedDuration = useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : null;
  }, [startDate, endDate]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header: Title & Month Nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
            {monthNames[currentMonth]} {currentYear}
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-gray-400 dark:text-gray-500">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          if (day.empty) {
            return <div key={day.key} className="h-9 sm:h-10" />;
          }

          let btnClass = 'w-full h-9 sm:h-10 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition relative ';

          if (day.isPast) {
            btnClass += 'text-gray-300 dark:text-slate-600 cursor-not-allowed bg-transparent';
          } else if (day.booked) {
            btnClass += 'bg-red-50 dark:bg-red-950/40 text-red-400 dark:text-red-500 line-through cursor-not-allowed border border-red-200/50 dark:border-red-900/50';
          } else if (day.isStart || day.isEnd) {
            btnClass += 'bg-emerald-600 text-white font-bold shadow-xs z-10';
          } else if (day.isInRange) {
            btnClass += 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 rounded-none first:rounded-l-xl last:rounded-r-xl';
          } else {
            btnClass += 'text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer';
          }

          if (day.isToday && !day.isStart && !day.isEnd && !day.booked) {
            btnClass += ' ring-1 ring-emerald-500/50';
          }

          return (
            <button
              key={day.key}
              type="button"
              disabled={day.isPast || !!day.booked}
              onClick={() => handleDayClick(day)}
              className={btnClass}
              title={
                day.booked
                  ? `Reserved (${day.booked.startDate} to ${day.booked.endDate})`
                  : day.isPast
                  ? 'Past date'
                  : `Select ${day.dateStr}`
              }
            >
              <span>{day.dayNum}</span>
              {day.booked && (
                <span className="w-1 h-1 rounded-full bg-red-400 dark:bg-red-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Conflict notice alert */}
      {conflictNotice && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/70 text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{conflictNotice}</span>
        </div>
      )}

      {/* Status Bar / Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            Selected
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
            Reserved
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-slate-700 inline-block" />
            Available
          </span>
        </div>

        {startDate && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              {startDate}
              {endDate ? ` → ${endDate}` : ' (pick return date)'}
              {selectedDuration && (
                <span className="ml-1.5 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 rounded-md font-bold text-[10px]">
                  {selectedDuration} {selectedDuration === 1 ? 'day' : 'days'}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              title="Reset selection"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartCalendar;
