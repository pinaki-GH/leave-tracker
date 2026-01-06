"use client";
import { useEffect, useState } from "react";
import { Leave } from "@/lib/types";
import { getData, saveData } from "@/lib/storage";

export default function LeaveList() {
  const [leaves, setLeaves] = useState<Leave[]>([]);

  useEffect(() => {
    setLeaves(getData("leaves"));
  }, []);

  const remove = (id: string) => {
    const updated = leaves.filter(l => l.id !== id);
    saveData("leaves", updated);
    setLeaves(updated);
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-bold mb-2">All Leaves</h2>

      {leaves.map(l => (
        <div key={l.id} className="border-b py-2 flex justify-between">
          <span>
            {l.memberName} | {l.leaveType} | {l.ptoDays} days
          </span>
          <button onClick={() => remove(l.id)} className="text-red-600">
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
