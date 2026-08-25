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
  projectStartDate?: string;
  lastWorkingDay?: string;
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
  const [memberHolidayOverrides, setMemberHolidayOverrides] = useState<any[]>([]);

  const [selectedYear, setSelectedYear] = useState(
    now.getFullYear()
  );

  const [selectedMember, setSelectedMember] = useState(
    "All Members"
  );

  // LEGEND FILTER STATES
  const [activeLegendFilter, setActiveLegendFilter] = useState<
    "All" | "Planned" | "Confirmed" | "Holiday"
  >("All");

  useEffect(() => {
    setMembers((getData("members") as Member[]) || []);
    setLeaves((getData("leaves") as Leave[]) || []);
    setHolidays((getData("companyHolidays") as Holiday[]) || []);
    setMemberHolidayOverrides(getData("memberHolidayOverrides") || []);
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

        const isoDate = `${selectedYear}-${String(
          monthIndex + 1
        ).padStart(2, "0")}-${String(day).padStart(
          2,
          "0"
        )}`;

        const dayLeaves = leaves.filter(l => {
          if (
            selectedMember !== "All Members" &&
            l.memberName !== selectedMember
          ) {
            return false;
          }

          // FILTER LOGIC
          if (
            activeLegendFilter === "Planned" &&
            l.status !== "Planned"
          ) {
            return false;
          }

          if (
            activeLegendFilter === "Confirmed" &&
            l.status !== "Confirmed"
          ) {
            return false;
          }

          // Hide all leaves when Holiday filter is active
          if (activeLegendFilter === "Holiday") {
            return false;
          }

          const member = members.find(
            m => m.name === l.memberName
          );

          const start = new Date(`${l.startDate}T00:00:00`);
          const end = new Date(`${l.endDate}T23:59:59`);

          if (member) {
            if (
              member.projectStartDate &&
              end < new Date(`${member.projectStartDate}T00:00:00`)
            ) {
              return false;
            }

            if (
              member.lastWorkingDay &&
              start > new Date(`${member.lastWorkingDay}T23:59:59`)
            ) {
              return false;
            }
          }

          return date >= start && date <= end;
        });

        let dayHolidays: Holiday[] = [];

        if (
          selectedMemberData &&
          (activeLegendFilter === "All" ||
            activeLegendFilter === "Holiday")
        ) {
          dayHolidays = holidays.filter(h => {
            const memberOverrides =
              memberHolidayOverrides.filter(
                o => o.memberId === selectedMemberData.id
              );

            // Remove overridden standard holidays
            const removed = memberOverrides.some(
              o =>
                o.action === "Remove" && o.holidayDate === h.date && o.holidayName === h.name
            );

            if (removed) return false;

            if (
              selectedMemberData.projectStartDate &&
              h.date < selectedMemberData.projectStartDate
            ) {
              return false;
            }

            if (
              selectedMemberData.lastWorkingDay &&
              h.date > selectedMemberData.lastWorkingDay
            ) {
              return false;
            }

            return (
              h.organization === selectedMemberData.organization &&
              h.location === selectedMemberData.location &&
              h.date === isoDate
            );
          });

          const customAddedHolidays =
            memberHolidayOverrides
              .filter(
                o =>
                  o.memberId === selectedMemberData.id &&
                  o.action === "Add" &&
                  o.holidayDate === isoDate &&
                  (!selectedMemberData.projectStartDate ||
                    o.holidayDate >= selectedMemberData.projectStartDate) &&
                  (!selectedMemberData.lastWorkingDay ||
                    o.holidayDate <= selectedMemberData.lastWorkingDay)
              )
              .map(o => ({
                id: o.id,
                name: o.holidayName,
                date: o.holidayDate,
                organization:
                  selectedMemberData.organization,
                location:
                  selectedMemberData.location,
              }));
          
          dayHolidays = [...dayHolidays,...customAddedHolidays,
          ];
          
        }

        const isLastWorkingDay =
          selectedMember !== "All Members" &&
          !!selectedMemberData?.lastWorkingDay &&
          isoDate === selectedMemberData.lastWorkingDay;

        calendarDays.push({
          day,
          date: isoDate,
          leaves: dayLeaves,
          holidays: dayHolidays,
          isLastWorkingDay,
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
    memberHolidayOverrides,
    selectedMember,
    selectedMemberData,
    selectedYear,
    activeLegendFilter,
  ]);

  return (
    <div className="space-y-6">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .print-grid {
            grid-template-columns: 1fr 1fr !important;
          }

          .print-month {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-legend-box {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="bg-white p-6 rounded shadow">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            Reporting
          </h1>

          <button
            onClick={() => window.print()}
            className="no-print bg-blue-600 text-white px-4 py-2 rounded"
          >
            Print / Save PDF
          </button>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-6">
          <h2 className="text-2xl font-bold">
            Yearly Leave Plan
          </h2>

          <div className="mt-2 text-base">
            <div>
              <span className="font-semibold">Team Member:</span>{" "}
              {selectedMember}
            </div>

            <div>
              <span className="font-semibold">Year:</span>{" "}
              {selectedYear}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="no-print flex flex-wrap gap-4 mb-6">
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
              setActiveLegendFilter("All");
            }}
            className="border px-4 py-2 rounded"
          >
            Clear Filter
          </button>
        </div>

        {/* Legend Filters */}
        <div className="flex flex-wrap gap-6 mb-6 text-sm">
          <button
            onClick={() =>
              setActiveLegendFilter(prev =>
                prev === "Planned" ? "All" : "Planned"
              )
            }
            className={`flex items-center gap-2 border rounded px-3 py-2 transition-colors ${
              activeLegendFilter === "Planned"
                ? "bg-yellow-50 border-yellow-300"
                : "bg-gray-100 border-gray-200"
            }`}
          >
            <div className="w-4 h-4 rounded border bg-yellow-200 print-legend-box"></div>
            <span>Planned Leave</span>
          </button>

          <button
            onClick={() =>
              setActiveLegendFilter(prev =>
                prev === "Confirmed" ? "All" : "Confirmed"
              )
            }
            className={`flex items-center gap-2 border rounded px-3 py-2 transition-colors ${
              activeLegendFilter === "Confirmed"
                ? "bg-green-50 border-green-300"
                : "bg-gray-100 border-gray-200"
            }`}
          >
            <div className="w-4 h-4 rounded border bg-green-200 print-legend-box"></div>
            <span>Confirmed Leave</span>
          </button>

          <button
            onClick={() =>
              setActiveLegendFilter(prev =>
                prev === "Holiday" ? "All" : "Holiday"
              )
            }
            className={`flex items-center gap-2 border rounded px-3 py-2 transition-colors ${
              activeLegendFilter === "Holiday"
                ? "bg-red-50 border-red-300"
                : "bg-gray-100 border-gray-200"
            }`}
          >
            <div className="w-4 h-4 rounded border bg-red-200 print-legend-box"></div>
            <span>Company Holiday</span>
          </button>

          {selectedMember !== "All Members" &&
            selectedMemberData?.lastWorkingDay && (
              <div className="flex items-center gap-2 border rounded px-3 py-2 bg-gray-100">
                <div className="w-4 h-4 rounded border-2 border-blue-600 bg-white print-legend-box"></div>
                <span>Last Working Day</span>
              </div>
            )}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 print-grid">
          {monthCalendars.map(month => (
            <div
              key={month.monthName}
              className="border rounded overflow-hidden print-month"
            >
              <div className="bg-gray-100 px-4 py-3 font-bold text-center">
                {month.monthName} {selectedYear}
              </div>

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
                      className={`min-h-[120px] border-r border-b p-1 text-xs ${
                        d.isLastWorkingDay
                          ? "border-2 border-blue-600"
                          : ""
                      }`}
                    >
                      <div className="font-semibold mb-1">
                        {d.day}
                      </div>

                      {d.holidays.map((h: Holiday) => (
                        <div
                          key={h.id}
                          className="bg-red-200 text-red-800 rounded px-1 py-0.5 mb-1"
                        >
                          {h.name}
                        </div>
                      ))}

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
