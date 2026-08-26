"use client";

import { Leave } from "@/lib/types";
import { exportLeavesToExcel } from "@/lib/exportToExcel";

type Props = {
  leaves: Leave[];
  allLeaves: Leave[];
  onEdit: (leave: Leave) => void;
  onDelete: (id: string) => void;

  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;

  selectedMember: string;
  selectedLeaveType: string;
  selectedStatus: string;
  onMemberChange: (v: string) => void;
  onLeaveTypeChange: (v: string) => void;
  onStatusChange: (v: string) => void;

  onClearFilters: () => void;
};

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function LeaveList({
  leaves,
  allLeaves,
  onEdit,
  onDelete,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  selectedMember,
  selectedLeaveType,
  selectedStatus,
  onMemberChange,
  onLeaveTypeChange,
  onStatusChange,
  onClearFilters,
}: Props) {
  const members = Array.from(
    new Set(allLeaves.map(l => l.memberName))
  ).sort((a, b) => a.localeCompare(b));

  const leaveTypes = Array.from(
    new Set(allLeaves.map(l => l.leaveType))
  );

  const years = Array.from(
    new Set(
      allLeaves.flatMap(l => {
        const startYear = new Date(l.startDate).getFullYear();
        const endYear = new Date(l.endDate).getFullYear();

        return startYear === endYear
          ? [startYear]
          : [startYear, endYear];
      })
    )
  ).sort();

  const displayLeaves = leaves.map(l => {
    const monthStart = new Date(
      selectedYear,
      selectedMonth,
      1
    );
    const monthEnd = new Date(
      selectedYear,
      selectedMonth + 1,
      0
    );

    const leaveStart = new Date(`${l.startDate}T00:00:00`);
    const leaveEnd = new Date(`${l.endDate}T00:00:00`);

    const displayStart =
      leaveStart > monthStart ? leaveStart : monthStart;
    const displayEnd =
      leaveEnd < monthEnd ? leaveEnd : monthEnd;

    let displayPtoDays = 0;
    const current = new Date(displayStart);

    while (current <= displayEnd) {
      const day = current.getDay();

      if (day !== 0 && day !== 6) {
        displayPtoDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    // Preserve manually entered PTO values for leaves that
    // are entirely within the selected month.
    if (
      leaveStart >= monthStart &&
      leaveEnd <= monthEnd
    ) {
      displayPtoDays = l.ptoDays;
    }

    return {
      ...l,
      displayStartDate: `${displayStart.getFullYear()}-${String(
        displayStart.getMonth() + 1
      ).padStart(2, "0")}-${String(
        displayStart.getDate()
      ).padStart(2, "0")}`,
      displayEndDate: `${displayEnd.getFullYear()}-${String(
        displayEnd.getMonth() + 1
      ).padStart(2, "0")}-${String(
        displayEnd.getDate()
      ).padStart(2, "0")}`,
      displayPtoDays,
    };
  });

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-bold">List of Leaves</h2>
        <div className="flex-1" />
        <button
          onClick={() => exportLeavesToExcel(allLeaves)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          Export to Excel
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <select
          className="border px-3 py-2 rounded text-sm"
          value={selectedMonth}
          onChange={e => onMonthChange(+e.target.value)}
        >
          {months.map((m, i) => (
            <option key={m} value={i}>{m}</option>
          ))}
        </select>

        <select
          className="border px-3 py-2 rounded text-sm"
          value={selectedYear}
          onChange={e => onYearChange(+e.target.value)}
        >
          {years.map(y => (
            <option key={y}>{y}</option>
          ))}
        </select>

        <select
          className="border px-3 py-2 rounded text-sm"
          value={selectedMember}
          onChange={e => onMemberChange(e.target.value)}
        >
          <option value="All">All Members</option>
          {members.map(m => (
            <option key={m}>{m}</option>
          ))}
        </select>

        <select
          className="border px-3 py-2 rounded text-sm"
          value={selectedLeaveType}
          onChange={e => onLeaveTypeChange(e.target.value)}
        >
          <option value="All">All Leave Types</option>
          {leaveTypes.map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <select
          className="border px-3 py-2 rounded text-sm"
          value={selectedStatus}
          onChange={e => onStatusChange(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Planned">Planned</option>
          <option value="Confirmed">Confirmed</option>
        </select>

        <div className="flex-1" />

        <button
          onClick={onClearFilters}
          className="border px-4 py-2 rounded text-sm"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Member</th>
            <th className="border p-2 text-center">Leave Type</th>
            <th className="border p-2 text-center">Status</th>
            <th className="border p-2 text-center">PTO Days</th>
            <th className="border p-2 text-center">Start</th>
            <th className="border p-2 text-center">End</th>
            <th className="border p-2 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {displayLeaves.map(l => (
            <tr key={l.id}>
              <td className="border p-2 text-left">{l.memberName}</td>
              <td className="border p-2 text-center">{l.leaveType}</td>
              <td className="border p-2 text-center">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm ${
                    l.status === "Confirmed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {l.status}
                </span>
              </td>
              <td className="border p-2 text-center">{l.displayPtoDays}</td>
              <td className="border p-2 text-center">{l.displayStartDate}</td>
              <td className="border p-2 text-center">{l.displayEndDate}</td>
              <td className="border p-2 text-center space-x-2">
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => onEdit(l)}
                >
                  Edit
                </button>
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => onDelete(l.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
