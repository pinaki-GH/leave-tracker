"use client";

import { useEffect, useMemo, useState } from "react";
import { Leave } from "@/lib/types";
import { getData, saveData } from "@/lib/storage";

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

type ApprovalStatus = "Approved" | "Pending";

type SummaryRow = {
  member: string;
  organization: string; // ✅ NEW
  totals: Record<string, number>;
  total: number;
  approvalStatus: ApprovalStatus;
};

export default function SummaryPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<string[]>([]);
  const [approvalMap, setApprovalMap] =
    useState<Record<string, ApprovalStatus>>({});

  // ✅ NEW: member → organization map
  const [memberOrgMap, setMemberOrgMap] =
    useState<Record<string, string>>({});

  const [month, setMonth] = useState<number | "All">(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLeaves((getData("leaves") as Leave[]) || []);

    const rawMembers = (getData("members") as any[]) || [];

    // Existing behavior
    setMembers(rawMembers.map(m => m.name));

    // ✅ Build organization lookup
    const orgMap: Record<string, string> = {};
    rawMembers.forEach(m => {
      orgMap[m.name] = m.organization || "—";
    });
    setMemberOrgMap(orgMap);

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
    const updated: Record<string, ApprovalStatus> = {
      ...approvalMap,
      [key]: status,
    };

    setApprovalMap(updated);

    // ✅ Cast ONLY at persistence boundary
    saveData("approvalStatus", updated as unknown as any[]);
  };

  const summary = useMemo<SummaryRow[]>(() => {
    const rows: SummaryRow[] = members.map(member => ({
      member,
      organization: memberOrgMap[member] || "—", // ✅ NEW
      totals: {},
      total: 0,
      approvalStatus:
        approvalMap[approvalKey(member)] || "Pending",
    }));

    rows.forEach(row => {
      leaveTypes.forEach(t => (row.totals[t] = 0));
    });

    leaves.forEach(l => {
      if (l.status !== "Confirmed") return;

      const d = new Date(l.startDate);
      if (month !== "All" && d.getMonth() !== month) return;
      if (d.getFullYear() !== year) return;

      const row = rows.find(r => r.member === l.memberName);
      if (!row) return;

      row.totals[l.leaveType] += l.ptoDays;
      row.total += l.ptoDays;
    });

    return rows.sort((a, b) =>
      a.member.localeCompare(b.member)
    );
  }, [leaves, members, leaveTypes, month, year, approvalMap, memberOrgMap]);

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
          className="border px-3 py-2 rounded text-sm"
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
          className="border px-3 py-2 rounded text-sm"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
        >
          {years.map(y => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Member</th>
            <th className="border p-2 text-left">Organization</th> {/* ✅ NEW */}
            {leaveTypes.map(t => (
              <th key={t} className="border p-2 text-center">
                {t}
              </th>
            ))}
            <th className="border p-2 text-center">Total</th>
            <th className="border p-2 text-center">
              Approval Status
            </th>
          </tr>
        </thead>

        <tbody>
          {summary.map(row => (
            <tr key={row.member}>
              <td className="border p-2 text-left">
                {row.member}
              </td>

              <td className="border p-2 text-left">
                {row.organization}
              </td>

              {leaveTypes.map(t => (
                <td key={t} className="border p-2 text-center">
                  {row.totals[t] || 0}
                </td>
              ))}

              <td className="border p-2 text-center font-semibold">
                {row.total}
              </td>

              <td className="border p-2 text-center">
                <select
                  value={row.approvalStatus}
                  onChange={e =>
                    updateApproval(
                      row.member,
                      e.target.value as ApprovalStatus
                    )
                  }
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    row.approvalStatus === "Approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                </select>
              </td>
            </tr>
          ))}

          {summary.length === 0 && (
            <tr>
              <td
                colSpan={leaveTypes.length + 4} // ✅ UPDATED
                className="text-center p-4 text-gray-500"
              >
                No data for selected period
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
