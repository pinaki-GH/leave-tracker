"use client";

import { useEffect, useMemo, useState } from "react";
import LeaveForm from "@/components/LeaveForm";
import { Leave } from "@/lib/types";
import { getData, saveData } from "@/lib/storage";
import { exportLeavesToExcel } from "@/lib/exportToExcel";

type Holiday = {
  id: string;
  organization: string; // ✅ ADDED
  location: string;
  date: string;
  name: string;
};

type Member = {
  id: string;
  name: string;
  organization: string; // ✅ ADDED
  location: string;
  projectStartDate?: string;
  lastWorkingDay?: string;
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

/*
 * Leave and holiday dates are date-only values (YYYY-MM-DD).
 * Do not use new Date("YYYY-MM-DD") for comparisons because JavaScript
 * interprets ISO date-only strings as UTC, which can cause month-end
 * dates to fall outside the local month boundary.
 */
const parseDateOnly = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export default function CalendarPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [membersData, setMembersData] = useState<Member[]>([]);
  const [memberHolidayOverrides, setMemberHolidayOverrides] = useState<any[]>([]);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [selectedMember, setSelectedMember] = useState("All");
  const [selectedLeaveType, setSelectedLeaveType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  useEffect(() => {
    setLeaves(getData("leaves") || []);

    // ✅ backward safe load
    const storedHolidays = (getData("companyHolidays") as any[]) || [];
    setHolidays(
      storedHolidays.map(h => ({
        ...h,
        organization: h.organization || "",
      }))
    );

    setMembersData(getData("members") || []);
    setMemberHolidayOverrides(getData("memberHolidayOverrides") || []);
    
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
    setSelectedMember("All");
    setSelectedLeaveType("All");
    setSelectedStatus("All");
  };

  /* ---------- VIRTUAL HOLIDAY LEAVES ---------- */

const holidayLeaves: Leave[] = useMemo(() => {
  const result: Leave[] = [];

  const overrides = memberHolidayOverrides;
  
  holidays.forEach(h => {
    const d = parseDateOnly(h.date);

    if (d.getMonth() !== month) return;
    if (d.getFullYear() !== year) return;

    membersData.forEach((m: any) => {
      // Standard Org + Location mapping
      if (
        m.location !== h.location ||
        m.organization !== h.organization
      )
        return;

      // Skip if member was not on the project on this date
      if (
        m.projectStartDate &&
        h.date < m.projectStartDate
      )
        return;

      if (
        m.lastWorkingDay &&
        h.date > m.lastWorkingDay
      )
        return;

      // Find overrides for this member
      const memberOverrides = overrides.filter(
        o => o.memberId === m.id
      );

      // Skip if holiday removed
      const removed = memberOverrides.some(
        o =>
          o.action === "Remove" &&
          o.holidayDate === h.date &&
          o.holidayName === h.name
      );

      if (removed) return;

      result.push({
        id: `holiday-${h.id}-${m.name}`,
        memberName: m.name,
        leaveType: "Company Holiday",
        ptoDays: 1,
        startDate: h.date,
        endDate: h.date,
        status: "Confirmed",
      });
    });
  });

  // Add custom holidays
  overrides
    .filter(o => o.action === "Add")
    .forEach(o => {
      const member = membersData.find(
        (m: any) => m.id === o.memberId
      );

      if (!member) return;

      if (
        member.projectStartDate &&
        o.holidayDate < member.projectStartDate
      )
        return;

      if (
        member.lastWorkingDay &&
        o.holidayDate > member.lastWorkingDay
      )
        return;

      const d = parseDateOnly(o.holidayDate);

      if (d.getMonth() !== month) return;
      if (d.getFullYear() !== year) return;

      result.push({
        id: `custom-holiday-${o.id}`,
        memberName: member.name,
        leaveType: "Company Holiday",
        ptoDays: 1,
        startDate: o.holidayDate,
        endDate: o.holidayDate,
        status: "Confirmed",
      });
    });

  return result;
}, [holidays, membersData, memberHolidayOverrides, month, year,]);

  /* ---------- MERGE LEAVES ---------- */

  const allLeaves = useMemo(() => {
    return [...leaves, ...holidayLeaves];
  }, [leaves, holidayLeaves]);

  /* ---------- Filtered Leaves ---------- */

  const filteredLeaves = useMemo(() => {
    return allLeaves.filter(l => {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      const leaveStart = parseDateOnly(l.startDate);
      const leaveEnd = parseDateOnly(l.endDate);

      if (leaveEnd < monthStart || leaveStart > monthEnd) {
        return false;
      }

      if (l.leaveType !== "Company Holiday") {
        const member = membersData.find(
          (m: any) => m.name === l.memberName
        );

        if (member) {
          const leaveStart = parseDateOnly(l.startDate);
          const leaveEnd = parseDateOnly(l.endDate);

          if (
            member.projectStartDate &&
            leaveEnd < parseDateOnly(member.projectStartDate)
          )
            return false;

          if (
            member.lastWorkingDay &&
            leaveStart > parseDateOnly(member.lastWorkingDay)
          )
            return false;
        }
      }
      if (selectedMember !== "All" && l.memberName !== selectedMember)
        return false;
      if (selectedLeaveType !== "All" && l.leaveType !== selectedLeaveType)
        return false;
      if (selectedStatus !== "All" && l.status !== selectedStatus)
        return false;

      return true;
    });
  }, [
    allLeaves,
    month,
    year,
    selectedMember,
    selectedLeaveType,
    selectedStatus,
  ]);

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

    filteredLeaves.forEach(l => {
      const member = membersData.find(
        (m: any) => m.name === l.memberName
      );

      const start = parseDateOnly(l.startDate);
      const end = parseDateOnly(l.endDate);

      if (member?.projectStartDate) {
        const projectStart = parseDateOnly(member.projectStartDate);

        if (start < projectStart) {
          start.setTime(projectStart.getTime());
        }
      }

      if (member?.lastWorkingDay) {
        const projectEnd = parseDateOnly(member.lastWorkingDay);

        if (end > projectEnd) {
          end.setTime(projectEnd.getTime());
        }
      }

      const current = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );

      while (current <= end) {
        const dayOfWeek = current.getDay();

        if (
          dayOfWeek !== 0 &&
          dayOfWeek !== 6 &&
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
  }, [filteredLeaves, membersData, month, year]);

  /* ---------- Filter Options ---------- */

  const members = Array.from(
    new Set(allLeaves.map(l => l.memberName))
  ).sort((a, b) => a.localeCompare(b));

  const leaveTypes = Array.from(
    new Set(allLeaves.map(l => l.leaveType))
  );

  const years = Array.from(
    new Set(
      allLeaves.flatMap(l => {
        const startYear = parseDateOnly(l.startDate).getFullYear();
        const endYear = parseDateOnly(l.endDate).getFullYear();

        return startYear === endYear
          ? [startYear]
          : [startYear, endYear];
      })
    )
  ).sort();

  /* ---------- UI ---------- */

  return (
    <>
      <LeaveForm
        onAdd={addLeave}
        onUpdate={updateLeave}
        editingLeave={editingLeave}
        onCancelEdit={() => setEditingLeave(null)}
      />

      <div className="bg-white p-6 rounded shadow">
        <div className="flex items-center mb-4">
          <h2 className="text-lg font-bold">Calendar View</h2>
          <div className="flex-1" />
          <button
            onClick={() => exportLeavesToExcel(allLeaves)}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            Export to Excel
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <select className="border px-3 py-2 rounded text-sm" value={month} onChange={e => setMonth(+e.target.value)}>
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>

          <select className="border px-3 py-2 rounded text-sm" value={year} onChange={e => setYear(+e.target.value)}>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>

          <select className="border px-3 py-2 rounded text-sm" value={selectedMember} onChange={e => setSelectedMember(e.target.value)}>
            <option value="All">All Members</option>
            {members.map(m => <option key={m}>{m}</option>)}
          </select>

          <select className="border px-3 py-2 rounded text-sm" value={selectedLeaveType} onChange={e => setSelectedLeaveType(e.target.value)}>
            <option value="All">All Leave Types</option>
            {leaveTypes.map(t => <option key={t}>{t}</option>)}
          </select>

          <select className="border px-3 py-2 rounded text-sm" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Planned">Planned</option>
            <option value="Confirmed">Confirmed</option>
          </select>

          <div className="flex-1" />

          <button onClick={clearFilters} className="border px-4 py-2 rounded text-sm text-gray-700 hover:bg-gray-100">
            Clear Filters
          </button>
        </div>

        {/* Calendar */}
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map(d => <div key={d} className="font-semibold text-center">{d}</div>)}

          {calendarDays.map((day, idx) => (
            <div key={idx} className="border rounded min-h-[120px] p-1 text-sm">
              {day && (
                <>
                  <div className="font-semibold mb-1">{day}</div>

                  {(leavesByDate[day] || []).map(l => (
                    <div
                      key={`${l.id}-${day}`}
                      className={`mb-1 px-2 py-1 rounded text-xs ${
                        l.leaveType === "Company Holiday"
                          ? "bg-red-100 text-red-700"
                          : l.status === "Confirmed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      <div className="font-medium">{l.memberName}</div>
                      <div>{l.leaveType}</div>

                      {!l.id.startsWith("holiday-") && (
                        <button
                          className="text-blue-600 underline mt-1"
                          onClick={() => setEditingLeave(l)}
                        >
                          Edit
                        </button>
                      )}
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
