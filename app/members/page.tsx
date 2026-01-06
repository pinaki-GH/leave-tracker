"use client";

import { useEffect, useState } from "react";
import { getData, saveData } from "@/lib/storage";

type Item = {
  id: string;
  name: string;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Item[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<Item[]>([]);
  const [memberName, setMemberName] = useState("");
  const [leaveTypeName, setLeaveTypeName] = useState("");

  useEffect(() => {
    setMembers(getData("members"));
    setLeaveTypes(getData("leaveTypes"));
  }, []);

  const addItem = (
    key: "members" | "leaveTypes",
    value: string,
    setter: (items: Item[]) => void
  ) => {
    if (!value.trim()) return;

    const newItem = { id: crypto.randomUUID(), name: value };
    const updated = [...getData<Item>(key), newItem];

    saveData(key, updated);
    setter(updated);
  };

  const removeItem = (
    key: "members" | "leaveTypes",
    id: string,
    setter: (items: Item[]) => void
  ) => {
    const updated = getData<Item>(key).filter(i => i.id !== id);
    saveData(key, updated);
    setter(updated);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Team Members</h1>

      <div className="flex gap-2 mb-3">
        <input
          className="border p-1 flex-1"
          placeholder="Member name"
          value={memberName}
          onChange={e => setMemberName(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-3 rounded"
          onClick={() => {
            addItem("members", memberName, setMembers);
            setMemberName("");
          }}
        >
          Add
        </button>
      </div>

      {members.map(m => (
        <div key={m.id} className="flex justify-between border-b py-1">
          <span>{m.name}</span>
          <button
            className="text-red-600"
            onClick={() => removeItem("members", m.id, setMembers)}
          >
            Delete
          </button>
        </div>
      ))}

      <h1 className="text-xl font-bold mt-6 mb-4">Leave Types</h1>

      <div className="flex gap-2 mb-3">
        <input
          className="border p-1 flex-1"
          placeholder="Leave type"
          value={leaveTypeName}
          onChange={e => setLeaveTypeName(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-3 rounded"
          onClick={() => {
            addItem("leaveTypes", leaveTypeName, setLeaveTypes);
            setLeaveTypeName("");
          }}
        >
          Add
        </button>
      </div>

      {leaveTypes.map(t => (
        <div key={t.id} className="flex justify-between border-b py-1">
          <span>{t.name}</span>
          <button
            className="text-red-600"
            onClick={() => removeItem("leaveTypes", t.id, setLeaveTypes)}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
