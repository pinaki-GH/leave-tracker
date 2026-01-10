"use client";

import { useEffect, useMemo, useState } from "react";
import LeaveForm from "@/components/LeaveForm";
import { Leave } from "@/lib/types";
import { getData, saveData } from "@/lib/storage";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function CalendarPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  useEffect(() => {
    setLeaves(getData("leaves"));
  }, []);

  /* ---------- CRUD ---------- */

  const addLeave = (leave: Leave) => {
    const updated = [...leaves, leave];
    setLeaves(updated);
    saveData("leaves", updated);
  };

  const updateLeave = (updatedLeave: Leave) => {
    const updated = leaves.map(l =>
      l.id === updatedLeave.id ? updatedLeave : l
    );
    setLeaves(updated);
    saveData("leaves", updated);
    setEditingLeave(null);
  };

  /* ---------- Clear Filters ---------- */

  const clearFilters = () => {
    setMonth(currentMonth);
    setYear(currentYear);
  };

  /* ---------- Calendar Grid ---------- */

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(d);

    return days;
  }, [month, year]);

  const leavesByDate = useMemo(() => {
    const map: Record<number, Leave[]> = {};

    leaves.forEach(l => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);

      const current = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );

      while (current <= end) {
        if (
          current.getMonth() === month &&
          current.getFullYear() === year
        ) {
          const day = current.getDate();
          map[day] = map[day] || [];
          map[day].push(l);
        }
        current.setDate(current.getDate() + 1);
      }
    });

    return map;
  }, [leaves, month, year]);

  const years = Array.from(
    new Set(leaves.map(l => new Date(l.startDate).getFullYear()))
  ).sort();

  /* ---------- UI ---------- */

  return (
    <>
      {/* ADD / EDIT LEAVE */}
      <LeaveForm
        onAdd={addLeave}
        onUpdate={updateLeave}
        editingLeave={editingLeave}
        onCancelEdit={() => setEditingLeave(null)}
      />

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-4">Calendar View</h2>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <select
            className="border px-3 py-2 rounded text-sm"
            value={month}
            onChange={e => setMonth(+e.target.value)}
          >
            {months.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>

          <select
            className="border px-3 py-2 rounded text-sm"
            value={year}
            onChange={e => setYear(+e.target.value)}
          >
            {years.map(y => (
              <option key={y}>{y}</option>
            ))}
          </select>

          {/* Push button to the right */}
          <div className="flex-1" />

          <button
            onClick={clearFilters}
            className="border px-4 py-2 rounded text-sm text-gray-700 hover:bg-gray-100"
          >
            Clear Filters
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map(d => (
            <div key={d} className="font-semibold text-center">
              {d}
            </div>
          ))}

          {calendarDays.map((day, idx) => (
            <div
              key={idx}
              className="border rounded min-h-[120px] p-1 text-sm"
            >
              {day && (
                <>
                  <div className="font-semibold mb-1">{day}</div>

                  {(leavesByDate[day] || []).map(l => (
                    <div
                      key={`${l.id}-${day}`}
                      className={`mb-1 px-2 py-1 rounded text-xs ${
                        l.status === "Confirmed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      <div className="font-medium">
                        {l.memberName}
                      </div>
                      <div>{l.leaveType}</div>

                      <button
                        className="text-blue-600 underline mt-1"
                        onClick={() => setEditingLeave(l)}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
