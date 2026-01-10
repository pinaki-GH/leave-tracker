"use client";

import { Leave } from "@/lib/types";

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
    new Set(allLeaves.map(l => new Date(l.startDate).getFullYear()))
  ).sort();

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-bold mb-4">List of Leaves</h2>

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
          className="border px-4 py-2 rounded text-sm text-gray-700 hover:bg-gray-100"
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
          {leaves.map(l => (
            <tr key={l.id}>
              <td className="border p-2 text-left">{l.memberName}</td>
              <td className="border p-2 text-center">{l.leaveType}</td>
              <td className="border p-2 text-center">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    l.status === "Confirmed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {l.status}
                </span>
              </td>
              <td className="border p-2 text-center">{l.ptoDays}</td>
              <td className="border p-2 text-center">{l.startDate}</td>
              <td className="border p-2 text-center">{l.endDate}</td>
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

          {leaves.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center p-4 text-gray-500">
                No leaves match the selected filters
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
