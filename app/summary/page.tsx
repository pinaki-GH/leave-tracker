"use client";

import { useEffect, useMemo, useState } from "react";
import { Leave } from "@/lib/types";
import { getData, saveData } from "@/lib/storage";

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

type ApprovalStatus = "Approved" | "Pending";

type Holiday = {
  id: string;
  location: string;
  date: string;
  name: string;
};

type SummaryRow = {
  member: string;
  organization: string;
  totals: Record<string, number>;
  totalLeaves: number;
  workingDays: number | null;
  effectiveWorkDays: number | null;
  approvalStatus: ApprovalStatus;
};

/* ================= HELPERS ================= */

function getWeekdays(year: number, month: number) {
  let count = 0;
  const date = new Date(year, month, 1);

  while (date.getMonth() === month) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
}

function getHolidayCount(
  holidays: Holiday[],
  location: string,
  year: number,
  month: number
) {
  return holidays.filter(h => {
    const d = new Date(h.date);
    return (
      h.location === location &&
      d.getFullYear() === year &&
      d.getMonth() === month &&
      d.getDay() !== 0 &&
      d.getDay() !== 6
    );
  }).length;
}

/* ================= COMPONENT ================= */

export default function SummaryPage() {
  const now = new Date();

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<string[]>([]);
  const [approvalMap, setApprovalMap] =
    useState<Record<string, ApprovalStatus>>({});
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [month, setMonth] = useState<number | "All">(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    setLeaves((getData("leaves") as Leave[]) || []);
    setMembers((getData("members") as any[]) || []);
    setHolidays((getData("companyHolidays") as Holiday[]) || []);

    setLeaveTypes(
      ((getData("leaveTypes") as any[]) || []).map(t => t.name)
    );

    const raw = getData("approvalStatus");
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      setApprovalMap(raw as Record<string, ApprovalStatus>);
    } else {
      setApprovalMap({});
    }
  }, []);

  const approvalKey = (member: string) =>
    `${year}-${month}-${member}`;

  const updateApproval = (member: string, status: ApprovalStatus) => {
    const key = approvalKey(member);
    const updated = { ...approvalMap, [key]: status };
    setApprovalMap(updated);
    saveData("approvalStatus", updated as unknown as any[]);
  };

  const summary = useMemo<SummaryRow[]>(() => {
    const rows: SummaryRow[] = members.map(m => ({
      member: m.name,
      organization: m.organization || "—",
      totals: {},
      totalLeaves: 0,
      workingDays: null,
      effectiveWorkDays: null,
      approvalStatus:
        approvalMap[approvalKey(m.name)] || "Pending",
    }));

    rows.forEach(r => {
      leaveTypes.forEach(t => (r.totals[t] = 0));
    });

    leaves.forEach(l => {
      if (l.status !== "Confirmed") return;

      const d = new Date(l.startDate);
      if (month !== "All" && d.getMonth() !== month) return;
      if (d.getFullYear() !== year) return;

      const row = rows.find(r => r.member === l.memberName);
      if (!row) return;

      row.totals[l.leaveType] += l.ptoDays;
      row.totalLeaves += l.ptoDays;
    });

    rows.forEach(r => {
      if (month === "All") return;

      const memberObj = members.find(m => m.name === r.member);
      const location = memberObj?.location || "";

      const weekdays = getWeekdays(year, month);
      const holidayCount = getHolidayCount(
        holidays,
        location,
        year,
        month
      );

      const finalWorkingDays = weekdays - holidayCount;

      r.workingDays = finalWorkingDays;
      r.effectiveWorkDays = Math.max(
        finalWorkingDays - r.totalLeaves,
        0
      );
    });

    return rows.sort((a, b) =>
      a.member.localeCompare(b.member)
    );
  }, [leaves, members, leaveTypes, month, year, approvalMap, holidays]);

  const years = Array.from(
    new Set(leaves.map(l => new Date(l.startDate).getFullYear()))
  ).sort();

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-bold mb-4">
        Summary View (Confirmed Leaves)
      </h2>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          className="border p-2"
          value={month}
          onChange={e =>
            setMonth(
              e.target.value === "All"
                ? "All"
                : Number(e.target.value)
            )
          }
        >
          <option value="All">All Months</option>
          {months.map((m, i) => (
            <option key={m} value={i}>{m}</option>
          ))}
        </select>

        <select
          className="border p-2"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
        >
          {years.map(y => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <table className="w-full border">
        <thead>
          <tr>
            <th>Member</th>
            <th>Organization</th>
            {leaveTypes.map(t => <th key={t}>{t}</th>)}
            <th>Total Leaves</th>
            <th>Working Days</th>
            <th>Effective Work Days</th>
            <th>Approval</th>
          </tr>
        </thead>

        <tbody>
          {summary.map(r => (
            <tr key={r.member}>
              <td>{r.member}</td>
              <td>{r.organization}</td>

              {leaveTypes.map(t => (
                <td key={t}>{r.totals[t]}</td>
              ))}

              <td>{r.totalLeaves}</td>
              <td>{r.workingDays ?? "—"}</td>
              <td>{r.effectiveWorkDays ?? "—"}</td>

              <td>
                <select
                  value={r.approvalStatus}
                  onChange={e =>
                    updateApproval(
                      r.member,
                      e.target.value as ApprovalStatus
                    )
                  }
                >
                  <option>Pending</option>
                  <option>Approved</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
