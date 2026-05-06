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
  organization: string;
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
  organization: string,
  location: string,
  year: number,
  month: number
) {
  return holidays.filter(h => {
    const d = new Date(h.date);
    return (
      h.location === location &&
      h.organization === organization &&
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

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<string[]>([]);
  const [approvalMap, setApprovalMap] =
    useState<Record<string, ApprovalStatus>>({});
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [month, setMonth] = useState<number | "All">(currentMonth);
  const [year, setYear] = useState(currentYear);

  // ✅ NEW FILTERS
  const [selectedMember, setSelectedMember] = useState("All");
  const [selectedOrg, setSelectedOrg] = useState("All");

  useEffect(() => {
    setLeaves((getData("leaves") as Leave[]) || []);
    setMembers((getData("members") as any[]) || []);

    const storedHolidays = (getData("companyHolidays") as any[]) || [];
    setHolidays(
      storedHolidays.map(h => ({
        ...h,
        organization: h.organization || "",
      }))
    );

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
    const rows: SummaryRow[] = members
      .filter(m =>
        (selectedMember === "All" || m.name === selectedMember) &&
        (selectedOrg === "All" || m.organization === selectedOrg)
      )
      .map(m => ({
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
      if (!memberObj) return;

      const holidayCount = getHolidayCount(
        holidays,
        memberObj.organization,
        memberObj.location,
        year,
        month
      );

      r.totalLeaves += holidayCount;

      if (!r.totals["Company Holiday"]) {
        r.totals["Company Holiday"] = 0;
      }
      r.totals["Company Holiday"] += holidayCount;
    });

    rows.forEach(r => {
      if (month === "All") return;

      const memberObj = members.find(m => m.name === r.member);
      const location = memberObj?.location || "";
      const organization = memberObj?.organization || "";

      const weekdays = getWeekdays(year, month);
      const holidayCount = getHolidayCount(
        holidays,
        organization,
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
  }, [leaves, members, leaveTypes, month, year, approvalMap, holidays, selectedMember, selectedOrg]);

  const years = Array.from(
    new Set(leaves.map(l => new Date(l.startDate).getFullYear()))
  ).sort();

  const memberOptions = ["All", ...members.map(m => m.name).sort()];
  const orgOptions = ["All", ...Array.from(new Set(members.map(m => m.organization))).sort()];

  const totalWorkingDays =
    month === "All" ? null : getWeekdays(year, month);

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-bold mb-4">
        Summary View (Confirmed Leaves)
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select className="border p-2" value={month} onChange={e => setMonth(e.target.value === "All" ? "All" : Number(e.target.value))}>
          <option value="All">All Months</option>
          {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>

        <select className="border p-2" value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>

        <select className="border p-2" value={selectedMember} onChange={e => setSelectedMember(e.target.value)}>
          {memberOptions.map(m => <option key={m}>{m}</option>)}
        </select>

        <select className="border p-2" value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}>
          {orgOptions.map(o => <option key={o}>{o || "—"}</option>)}
        </select>

        <button
          onClick={() => {
            setMonth(currentMonth);
            setYear(currentYear);
            setSelectedMember("All");
            setSelectedOrg("All");
          }}
          className="ml-auto border px-4 py-2 rounded"
        >
          Clear Filter
        </button>
      </div>

      {/* Working Days */}
      {month !== "All" && (
        <div className="mb-4 font-medium">
          Total Working Days: {totalWorkingDays}
        </div>
      )}

      {/* Table */}
      <table className="w-full border">
        <thead>
          <tr>
            <th>Member</th>
            <th>Organization</th>
            {leaveTypes.map(t => <th key={t}>{t}</th>)}
            <th>Total Leaves</th>
            <th>Effective Work Days</th>
            <th>Approval Status</th>
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
                  className={`px-2 py-1 rounded ${
                    r.approvalStatus === "Approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
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
