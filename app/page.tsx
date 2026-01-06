"use client";

import { useEffect, useMemo, useState } from "react";
import LeaveForm from "@/components/LeaveForm";
import LeaveList from "@/components/LeaveList";
import { Leave } from "@/lib/types";
import { getData, saveData } from "@/lib/storage";

export default function Home() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  useEffect(() => {
    setLeaves(getData("leaves"));
  }, []);

  const addLeave = (leave: Leave) => {
    const updated = [...leaves, leave];
    setLeaves(updated);
    saveData("leaves", updated);
  };

  const updateLeave = (updatedLeave: Leave) => {
    const updated = leaves.map(l =>
      l.id === updatedLeave.id ? updatedLeave : l
    );
    setLeaves(updated);
    saveData("leaves", updated);
    setEditingLeave(null);
  };

  const deleteLeave = (id: string) => {
    const updated = leaves.filter(l => l.id !== id);
    setLeaves(updated);
    saveData("leaves", updated);
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const start = new Date(l.startDate);
      return (
        start.getMonth() === selectedMonth &&
        start.getFullYear() === selectedYear
      );
    });
  }, [leaves, selectedMonth, selectedYear]);

  return (
    <>
      <LeaveForm
        onAdd={addLeave}
        onUpdate={updateLeave}
        editingLeave={editingLeave}
        onCancelEdit={() => setEditingLeave(null)}
        selectedYear={selectedYear}
      />

      <LeaveList
        leaves={filteredLeaves}
        allLeaves={leaves}
        onEdit={setEditingLeave}
        onDelete={deleteLeave}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
      />
    </>
  );
}
