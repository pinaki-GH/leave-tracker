"use client";
import { useEffect, useState } from "react";
import { Leave } from "@/lib/types";
import { getData, saveData } from "@/lib/storage";

export default function LeaveForm() {
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

  const submit = () => {
    const leaves = getData<Leave>("leaves");
    saveData("leaves", [...leaves, { ...form, id: crypto.randomUUID() }]);
    alert("Leave added");
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h2 className="font-bold mb-2">Create Leave</h2>

      <select onChange={e => setForm({ ...form, memberName: e.target.value })}>
        <option>Select Member</option>
        {members.map(m => <option key={m}>{m}</option>)}
      </select>

      <select onChange={e => setForm({ ...form, leaveType: e.target.value })}>
        <option>Select Leave Type</option>
        {types.map(t => <option key={t}>{t}</option>)}
      </select>

      <input type="number" placeholder="PTO Days"
        onChange={e => setForm({ ...form, ptoDays: +e.target.value })} />

      <input type="datetime-local"
        onChange={e => setForm({ ...form, startDate: e.target.value })} />

      <input type="datetime-local"
        onChange={e => setForm({ ...form, endDate: e.target.value })} />

      <button onClick={submit} className="bg-blue-600 text-white px-4 py-1 rounded">
        Save
      </button>
    </div>
  );
}
