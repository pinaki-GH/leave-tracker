"use client";

import { useEffect, useState } from "react";
import { Leave } from "@/lib/types";
import { getData } from "@/lib/storage";

type Props = {
  onAdd: (leave: Leave) => void;
};

export default function LeaveForm({ onAdd }: Props) {
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

  const save = () => {
    onAdd({ ...form, id: crypto.randomUUID() });
    setForm({
      memberName: "",
      leaveType: "",
      ptoDays: 1,
      startDate: "",
      endDate: "",
    });
  };

  return (
    <div className="bg-white p-6 rounded shadow mb-6">
      <h2 className="text-lg font-bold mb-4">Add New Leave</h2>

      <div className="grid grid-cols-6 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">Member Name</label>
          <select
            className="w-full border p-2"
            value={form.memberName}
            onChange={e => setForm({ ...form, memberName: e.target.value })}
          >
            <option value="">Select Member</option>
            {members.map(m => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Leave Type</label>
          <select
            className="w-full border p-2"
            value={form.leaveType}
            onChange={e => setForm({ ...form, leaveType: e.target.value })}
          >
            <option value="">Select Leave Type</option>
            {types.map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">PTO Days</label>
          <input
            type="number"
            className="w-full border p-2"
            value={form.ptoDays}
            onChange={e => setForm({ ...form, ptoDays: +e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Start Date & Time</label>
          <input
            type="datetime-local"
            className="w-full border p-2"
            value={form.startDate}
            onChange={e => setForm({ ...form, startDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">End Date & Time</label>
          <input
            type="datetime-local"
            className="w-full border p-2"
            value={form.endDate}
            onChange={e => setForm({ ...form, endDate: e.target.value })}
          />
        </div>

        <button
          onClick={save}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
}
