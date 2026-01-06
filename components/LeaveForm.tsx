"use client";

import { useEffect, useState } from "react";
import { Leave, LeaveStatus } from "@/lib/types";
import { getData } from "@/lib/storage";

type Props = {
  onAdd: (leave: Leave) => void;
  onUpdate: (leave: Leave) => void;
  editingLeave: Leave | null;
  onCancelEdit: () => void;
  selectedYear: number;
};

export default function LeaveForm({
  onAdd,
  onUpdate,
  editingLeave,
  onCancelEdit,
  selectedYear,
}: Props) {
  const [members, setMembers] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [form, setForm] = useState<Omit<Leave, "id">>({
    memberName: "",
    leaveType: "",
    ptoDays: 1,
    startDate: "",
    endDate: "",
    status: "Planned",
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

  const minDate = `${selectedYear}-01-01T00:00`;
  const maxDate = `${selectedYear}-12-31T23:59`;

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
      status: "Planned",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold">
          {editingLeave ? "Edit Leave" : "Add New Leave"}
        </h2>
      </div>

      <div className="px-6 py-6 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
          {/* Member */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Member Name
            </label>
            <select
              className="w-full border px-3 py-2 rounded"
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
              className="w-full border px-3 py-2 rounded"
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

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Leave Status
            </label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={form.status}
              onChange={e =>
                setForm({
                  ...form,
                  status: e.target.value as LeaveStatus,
                })
              }
            >
              <option value="Planned">Planned</option>
              <option value="Confirmed">Confirmed</option>
            </select>
          </div>

          {/* PTO */}
          <div>
            <label className="block text-sm font-medium mb-1">
              PTO Days
            </label>
            <input
              type="number"
              className="w-full border px-3 py-2 rounded"
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
              min={minDate}
              max={maxDate}
              className="w-full border px-3 py-2 rounded"
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
              min={minDate}
              max={maxDate}
              className="w-full border px-3 py-2 rounded"
              value={form.endDate}
              onChange={e =>
                setForm({ ...form, endDate: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 px-6 py-4 border-t">
        {editingLeave && (
          <button
            onClick={onCancelEdit}
            className="border px-4 py-2 rounded"
          >
            Cancel
          </button>
        )}
        <button
          onClick={submit}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          {editingLeave ? "Update Leave" : "Save Leave"}
        </button>
      </div>
    </div>
  );
}
