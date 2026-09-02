"use client";

import { useEffect, useMemo, useState } from "react";
import LeaveForm from "@/components/LeaveForm";
import LeaveList from "@/components/LeaveList";
import { Leave } from "@/lib/types";
import { getData, saveData } from "@/lib/storage";

/*
 * IMPORTANT:
 * Leave dates are date-only values (YYYY-MM-DD).
 *
 * Do NOT use new Date("YYYY-MM-DD") for date-only comparisons,
 * because JavaScript interprets ISO date-only strings as UTC dates.
 *
 * This helper creates a local date at midnight from the individual
 * year/month/day components, avoiding timezone-related date shifts.
 */
const parseDateOnly = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
};

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

  /*
   * Load leaves and members from Local Storage.
   */
  useEffect(() => {
    setLeaves(getData("leaves") || []);
    setMembers(getData("members") || []);
  }, []);

  /*
   * Check whether the complete leave period overlaps with the
   * team member's project participation period.
   *
   * Date-only comparison is used throughout.
   */
  const isLeaveWithinProjectPeriod = (leave: Leave) => {
    const member = members.find(
      m => m.name === leave.memberName
    );

    // If member information cannot be found, do not block the leave.
    if (!member) return true;

    const leaveStart = parseDateOnly(leave.startDate);
    const leaveEnd = parseDateOnly(leave.endDate);

    if (member.projectStartDate) {
      const projectStart = parseDateOnly(member.projectStartDate);

      if (leaveEnd < projectStart) {
        return false;
      }
    }

    if (member.lastWorkingDay) {
      const lastWorkingDay = parseDateOnly(member.lastWorkingDay);

      if (leaveStart > lastWorkingDay) {
        return false;
      }
    }

    return true;
  };

  /*
   * Add Leave
   */
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

  /*
   * Update Leave
   */
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

  /*
   * Delete Leave
   */
  const deleteLeave = (id: string) => {
    const updated = leaves.filter(l => l.id !== id);

    setLeaves(updated);
    saveData("leaves", updated);

    // If the deleted leave was being edited, exit edit mode.
    if (editingLeave?.id === id) {
      setEditingLeave(null);
    }
  };

  /*
   * Filter + Sort
   *
   * A leave is included in the selected month if its date range
   * overlaps the selected calendar month.
   *
   * Examples:
   *
   * 2026-04-30 → 2026-04-30
   *     appears in April.
   *
   * 2026-04-30 → 2026-05-04
   *     appears in both April and May.
   *
   * 2026-03-30 → 2026-04-02
   *     appears in both March and April.
   */
  const filteredLeaves = useMemo(() => {
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

    return leaves
      .filter(l => {
        const leaveStart = parseDateOnly(l.startDate);
        const leaveEnd = parseDateOnly(l.endDate);

        /*
         * Range-overlap test.
         *
         * Include the leave when:
         *
         * leaveEnd >= monthStart
         * AND
         * leaveStart <= monthEnd
         *
         * This correctly handles:
         * - normal leaves
         * - month-end leaves
         * - month-start leaves
         * - cross-month leaves
         * - cross-year leaves
         */
        if (
          leaveEnd < monthStart ||
          leaveStart > monthEnd
        ) {
          return false;
        }

        /*
         * Member filter
         */
        if (
          selectedMember !== "All" &&
          l.memberName !== selectedMember
        ) {
          return false;
        }

        /*
         * Leave type filter
         */
        if (
          selectedLeaveType !== "All" &&
          l.leaveType !== selectedLeaveType
        ) {
          return false;
        }

        /*
         * Status filter
         */
        if (
          selectedStatus !== "All" &&
          l.status !== selectedStatus
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dateDiff =
          parseDateOnly(a.startDate).getTime() -
          parseDateOnly(b.startDate).getTime();

        if (dateDiff !== 0) {
          return dateDiff;
        }

        return a.memberName.localeCompare(
          b.memberName
        );
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
