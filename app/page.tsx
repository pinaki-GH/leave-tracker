"use client";

import { useEffect, useMemo, useState } from "react";
import LeaveForm from "@/components/LeaveForm";
import LeaveList from "@/components/LeaveList";
import { Leave } from "@/lib/types";
import { getData, saveData } from "@/lib/storage";

export default function Home() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);
  const [members, setMembers] = useState<
    {
      id: string;
      name: string;
      projectStartDate?: string;
      lastWorkingDay?: string;
    }[]
  >([]);

  // Default current month/year
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMember, setSelectedMember] = useState("All");
  const [selectedLeaveType, setSelectedLeaveType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  useEffect(() => {
    setLeaves(getData("leaves"));
    setMembers(getData("members") || []);
  }, []);

  const isLeaveWithinProjectPeriod = (leave: Leave) => {
    const member = members.find(m => m.name === leave.memberName);

    if (!member) return true;

    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);

    if (
      member.projectStartDate &&
      leaveEnd < new Date(member.projectStartDate)
    ) {
      return false;
    }

    if (
      member.lastWorkingDay &&
      leaveStart > new Date(member.lastWorkingDay)
    ) {
      return false;
    }

    return true;
  };

  const addLeave = (leave: Leave) => {
    if (!isLeaveWithinProjectPeriod(leave)) {
      alert(
        "The selected leave dates are outside the team member's project participation period."
      );
      return;
    }

    const updated = [...leaves, leave];
    setLeaves(updated);
    saveData("leaves", updated);
  };

  const updateLeave = (updatedLeave: Leave) => {
    if (!isLeaveWithinProjectPeriod(updatedLeave)) {
      alert(
        "The selected leave dates are outside the team member's project participation period."
      );
      return;
    }

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

  // 🔍 Filter + SORT
  const filteredLeaves = useMemo(() => {
    return leaves
      .filter(l => {
        const monthStart = new Date(
          selectedYear,
          selectedMonth,
          1
        );
        const monthEnd = new Date(
          selectedYear,
          selectedMonth + 1,
          0
        );
        const leaveStart = new Date(l.startDate);
        const leaveEnd = new Date(l.endDate);

        if (leaveEnd < monthStart || leaveStart > monthEnd) {
          return false;
        }

        if (selectedMember !== "All" && l.memberName !== selectedMember)
          return false;
        if (selectedLeaveType !== "All" && l.leaveType !== selectedLeaveType)
          return false;
        if (selectedStatus !== "All" && l.status !== selectedStatus)
          return false;

        return true;
      })
      .sort((a, b) => {
        const dateDiff =
          new Date(a.startDate).getTime() -
          new Date(b.startDate).getTime();

        if (dateDiff !== 0) return dateDiff;

        return a.memberName.localeCompare(b.memberName);
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
        onClearFilters={() => {
          setSelectedMember("All");
          setSelectedLeaveType("All");
          setSelectedStatus("All");
          setSelectedMonth(currentMonth);
          setSelectedYear(currentYear);
        }}
      />
    </>
  );
}
