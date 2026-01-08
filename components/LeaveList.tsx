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
              {/* Member */}
              <td className="border p-2 text-left">
                {l.memberName}
              </td>

              {/* Leave Type */}
              <td className="border p-2 text-center">
                {l.leaveType}
              </td>

              {/* Status */}
              <td className="border p-2 text-center">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                    ${
                      l.status === "Confirmed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  `}
                >
                  {l.status}
                </span>
              </td>

              {/* PTO */}
              <td className="border p-2 text-center">
                {l.ptoDays}
              </td>

              {/* Start */}
              <td className="border p-2 text-center">
                {l.startDate}
              </td>

              {/* End */}
              <td className="border p-2 text-center">
                {l.endDate}
              </td>

              {/* Actions */}
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
              <td
                colSpan={7}
                className="text-center p-4 text-gray-500"
              >
                No leaves found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
