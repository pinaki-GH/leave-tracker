"use client";
import { useState } from "react";
import { getData, saveData } from "@/lib/storage";

export default function MembersPage() {
  const [member, setMember] = useState("");
  const [type, setType] = useState("");

  const add = (key: string, value: string) => {
    const data = getData<any>(key);
    saveData(key, [...data, { id: crypto.randomUUID(), name: value }]);
    alert("Saved");
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-bold">Members</h2>
      <input onChange={e => setMember(e.target.value)} />
      <button onClick={() => add("members", member)}>Add</button>

      <h2 className="font-bold mt-4">Leave Types</h2>
      <input onChange={e => setType(e.target.value)} />
      <button onClick={() => add("leaveTypes", type)}>Add</button>
    </div>
  );
}
