"use client";

import { useEffect, useMemo, useState } from "react";
import LeaveForm from "@/components/LeaveForm";
import LeaveList from "@/components/LeaveList";
import { Leave } from "@/lib/types";
import { getData, saveData } from "@/lib/storage";

export default function Home() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);

  // Time filters
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  // New filters
  const [selectedMember, setSelectedMember] = useState<string>("All");
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

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

  // 🔍 Combined filtering logic
  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const d = new Date(l.startDate);

      if (d.getMonth() !== selectedMonth) return false;
      if (d.getFullYear() !== selectedYear) return false;

      if (selectedMember !== "All" && l.memberName !== selectedMember)
        return false;

      if (selectedLeaveType !== "All" && l.leaveType !== selectedLeaveType)
        return false;

      if (selectedStatus !== "All" && l.status !== selectedStatus)
        return false;

      return true;
    });
  }, [
    leaves,
    selectedMonth,
    selectedYear,
    selectedMember,
    selectedLeaveType,
    selectedStatus,
  ]);

  return (
    <>
      <LeaveForm
        onAdd={addLeave}
        onUpdate={updateLeave}
        editingLeave={editingLeave}
        onCancelEdit={() => setEditingLeave(null)}
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
        selectedMember={selectedMember}
        selectedLeaveType={selectedLeaveType}
        selectedStatus={selectedStatus}
        onMemberChange={setSelectedMember}
        onLeaveTypeChange={setSelectedLeaveType}
        onStatusChange={setSelectedStatus}
      />
    </>
  );
}
