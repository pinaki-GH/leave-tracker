"use client";

import { useEffect, useState } from "react";
import LeaveForm from "@/components/LeaveForm";
import LeaveList from "@/components/LeaveList";
import { Leave } from "@/lib/types";
import { getData, saveData } from "@/lib/storage";

export default function Home() {
  const [leaves, setLeaves] = useState<Leave[]>([]);

  useEffect(() => {
    setLeaves(getData("leaves"));
  }, []);

  const addLeave = (leave: Leave) => {
    const updated = [...leaves, leave];
    setLeaves(updated);
    saveData("leaves", updated);
  };

  const updateLeaves = (updated: Leave[]) => {
    setLeaves(updated);
    saveData("leaves", updated);
  };

  return (
    <>
      <LeaveForm onAdd={addLeave} />
      <LeaveList leaves={leaves} onChange={updateLeaves} />
    </>
  );
}
