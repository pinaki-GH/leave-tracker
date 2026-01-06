"use client";

import { Leave } from "@/lib/types";

type Props = {
  leaves: Leave[];
  onEdit: (leave: Leave) => void;
  onDelete: (id: string) => void;
};

export default function LeaveList({ leaves, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-bold mb-4">List of Leaves</h2>

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
              <td className="border p-2 space-x-3">
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
                No leaves added yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
