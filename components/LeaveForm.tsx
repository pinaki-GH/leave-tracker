"use client";

import { useEffect, useState } from "react";
import { Leave } from "@/lib/types";
import { getData } from "@/lib/storage";

type Props = {
  onAdd: (leave: Leave) => void;
  onUpdate: (leave: Leave) => void;
  editingLeave: Leave | null;
  onCancelEdit: () => void;
};

export default function LeaveForm({
  onAdd,
  onUpdate,
  editingLeave,
  onCancelEdit,
}: Props) {
  const [members, setMembers] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [form, setForm] = useState<Omit<Leave, "id">>({
    memberName: "",
    leaveType: "",
    ptoDays: 1,
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    setMembers(getData<any>("members").map(m => m.name));
    setTypes(getData<any>("leaveTypes").map(t => t.name));
  }, []);

  useEffect(() => {
    if (editingLeave) {
      const { id, ...rest } = editingLeave;
      setForm(rest);
    }
  }, [editingLeave]);

  const submit = () => {
    if (editingLeave) {
      onUpdate({ ...form, id: editingLeave.id });
    } else {
      onAdd({ ...form, id: crypto.randomUUID() });
    }

    setForm({
      memberName: "",
      leaveType: "",
      ptoDays: 1,
      startDate: "",
      endDate: "",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold">
          {editingLeave ? "Edit Leave" : "Add New Leave"}
        </h2>
      </div>

      {/* Form Body */}
      <div className="px-6 py-6 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Member */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Member Name
            </label>
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.memberName}
              onChange={e =>
                setForm({ ...form, memberName: e.target.value })
              }
            >
              <option value="">Select Member</option>
              {members.map(m => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Leave Type
            </label>
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.leaveType}
              onChange={e =>
                setForm({ ...form, leaveType: e.target.value })
              }
            >
              <option value="">Select Leave Type</option>
              {types.map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* PTO Days */}
          <div>
            <label className="block text-sm font-medium mb-1">
              PTO Days
            </label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.ptoDays}
              onChange={e =>
                setForm({ ...form, ptoDays: +e.target.value })
              }
            />
          </div>

          {/* Start */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.startDate}
              onChange={e =>
                setForm({ ...form, startDate: e.target.value })
              }
            />
          </div>

          {/* End */}
          <div>
            <label className="block text-sm font-medium mb-1">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.endDate}
              onChange={e =>
                setForm({ ...form, endDate: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t bg-white">
        {editingLeave && (
          <button
            onClick={onCancelEdit}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
        )}

        <button
          onClick={submit}
          className="px-6 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          {editingLeave ? "Update Leave" : "Save Leave"}
        </button>
      </div>
    </div>
  );
}
