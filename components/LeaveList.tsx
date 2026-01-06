"use client";

import { Leave } from "@/lib/types";
import { getData } from "@/lib/storage";

type Props = {
  leaves: Leave[];
  allLeaves: Leave[];
  onEdit: (leave: Leave) => void;
  onDelete: (id: string) => void;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
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
}: Props) {
  const members = Array.from(
    new Set(allLeaves.map(l => l.memberName))
  );

  const years = Array.from(
    new Set(
      allLeaves.map(l => new Date(l.startDate).getFullYear())
    )
  ).sort();

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-bold mb-4">List of Leaves</h2>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select
          className="border px-3 py-2 rounded"
          value={selectedMonth}
          onChange={e => onMonthChange(+e.target.value)}
        >
          {months.map((m, i) => (
            <option key={m} value={i}>{m}</option>
          ))}
        </select>

        <select
          className="border px-3 py-2 rounded"
          value={selectedYear}
          onChange={e => onYearChange(+e.target.value)}
        >
          {years.map(y => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Member Name</th>
            <th className="border p-2 text-left">Leave Type</th>
            <th className="border p-2 text-left">PTO Days</th>
            <th className="border p-2 text-left">Start Date & Time</th>
            <th className="border p-2 text-left">End Date & Time</th>
            <th className="border p-2 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {leaves.map(l => (
            <tr key={l.id}>
              <td className="border p-2">{l.memberName}</td>
              <td className="border p-2">{l.leaveType}</td>
              <td className="border p-2">{l.ptoDays}</td>
              <td className="border p-2">{l.startDate}</td>
              <td className="border p-2">{l.endDate}</td>
              <td className="border p-2 space-x-2">
                <button
                  className="text-blue-600"
                  onClick={() => onEdit(l)}
                >
                  Edit
                </button>
                <button
                  className="text-red-600"
                  onClick={() => onDelete(l.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {leaves.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center p-4 text-gray-500">
                No leaves found for selected month
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
