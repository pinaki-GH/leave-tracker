"use client";

import { useEffect, useMemo, useState } from "react";
import { getData } from "@/lib/storage";
import { Leave } from "@/lib/types";

type Member = {
  id: string;
  name: string;
  organization: string;
  location: string;
  managedBy: string;
};

type Holiday = {
  id: string;
  organization: string;
  location: string;
  date: string;
  name: string;
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function ReportingPage() {
  const now = new Date();

  const [members, setMembers] = useState<Member[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [selectedYear, setSelectedYear] = useState(
    now.getFullYear()
  );

  const [selectedMember, setSelectedMember] = useState(
    "All Members"
  );

  useEffect(() => {
    setMembers((getData("members") as Member[]) || []);
    setLeaves((getData("leaves") as Leave[]) || []);
    setHolidays((getData("companyHolidays") as Holiday[]) || []);
  }, []);

  const years = useMemo(() => {
    const leaveYears = leaves.map(l =>
      new Date(l.startDate).getFullYear()
    );

    const holidayYears = holidays.map(h =>
      new Date(h.date).getFullYear()
    );

    return Array.from(
      new Set([
        ...leaveYears,
        ...holidayYears,
        now.getFullYear(),
      ])
    ).sort();
  }, [leaves, holidays, now]);

  const memberOptions = useMemo(() => {
    return [
      "All Members",
      ...members
        .map(m => m.name)
        .sort((a, b) => a.localeCompare(b)),
    ];
  }, [members]);

  const selectedMemberData = members.find(
    m => m.name === selectedMember
  );

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (
    year: number,
    month: number
  ) => {
    return new Date(year, month, 1).getDay();
  };

  const monthCalendars = useMemo(() => {
    return months.map((monthName, monthIndex) => {
      const daysInMonth = getDaysInMonth(
        selectedYear,
        monthIndex
      );

      const firstDay = getFirstDayOfMonth(
        selectedYear,
        monthIndex
      );

      const calendarDays: any[] = [];

      for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(
          selectedYear,
          monthIndex,
          day
        );

        const isoDate = date.toISOString().split("T")[0];

        const dayLeaves = leaves.filter(l => {
          if (
            selectedMember !== "All Members" &&
            l.memberName !== selectedMember
          ) {
            return false;
          }

          const start = new Date(l.startDate);
          const end = new Date(l.endDate);

          return date >= start && date <= end;
        });

        let dayHolidays: Holiday[] = [];

        if (selectedMemberData) {
          dayHolidays = holidays.filter(h => {
            return (
              h.organization ===
                selectedMemberData.organization &&
              h.location ===
                selectedMemberData.location &&
              h.date === isoDate
            );
          });
        }

        calendarDays.push({
          day,
          date: isoDate,
          leaves: dayLeaves,
          holidays: dayHolidays,
        });
      }

      return {
        monthName,
        calendarDays,
      };
    });
  }, [
    leaves,
    holidays,
    selectedMember,
    selectedMemberData,
    selectedYear,
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-6">
          Reporting
        </h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={selectedYear}
            onChange={e =>
              setSelectedYear(Number(e.target.value))
            }
            className="border p-2 rounded"
          >
            {years.map(y => (
              <option key={y}>{y}</option>
            ))}
          </select>

          <select
            value={selectedMember}
            onChange={e =>
              setSelectedMember(e.target.value)
            }
            className="border p-2 rounded"
          >
            {memberOptions.map(m => (
              <option key={m}>{m}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setSelectedYear(now.getFullYear());
              setSelectedMember("All Members");
            }}
            className="border px-4 py-2 rounded"
          >
            Clear Filter
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-200 border"></div>
            <span>Planned Leave</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-200 border"></div>
            <span>Confirmed Leave</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-200 border"></div>
            <span>Company Holiday</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {monthCalendars.map(month => (
            <div
              key={month.monthName}
              className="border rounded overflow-hidden"
            >
              {/* Month Header */}
              <div className="bg-gray-100 px-4 py-3 font-bold text-center">
                {month.monthName} {selectedYear}
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 bg-gray-50 text-sm font-medium border-b">
                {[
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ].map(day => (
                  <div
                    key={day}
                    className="p-2 text-center border-r last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7">
                {month.calendarDays.map((d, idx) => {
                  if (!d) {
                    return (
                      <div
                        key={idx}
                        className="min-h-[120px] border-r border-b bg-gray-50"
                      />
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className="min-h-[120px] border-r border-b p-1 text-xs"
                    >
                      {/* Day Number */}
                      <div className="font-semibold mb-1">
                        {d.day}
                      </div>

                      {/* Holidays */}
                      {d.holidays.map((h: Holiday) => (
                        <div
                          key={h.id}
                          className="bg-red-200 text-red-800 rounded px-1 py-0.5 mb-1"
                        >
                          🎉 {h.name}
                        </div>
                      ))}

                      {/* Leaves */}
                      {d.leaves.map((l: Leave) => (
                        <div
                          key={l.id}
                          className={`rounded px-1 py-0.5 mb-1 ${
                            l.status === "Confirmed"
                              ? "bg-green-200 text-green-800"
                              : "bg-yellow-200 text-yellow-800"
                          }`}
                        >
                          <div className="font-medium">
                            {l.memberName}
                          </div>

                          <div>{l.leaveType}</div>

                          <div className="text-[10px]">
                            {l.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
