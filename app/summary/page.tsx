"use client";

import { useEffect, useMemo, useState } from "react";
import { Leave } from "@/lib/types";
import { getData } from "@/lib/storage";

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

type Member = {
  id: string;
  name: string;
  organization?: string;
  location?: string;
};

type SummaryRow = {
  member: string;
  organization: string;
  totals: Record<string, number>;
  total: number;
};

export default function SummaryPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<string[]>([]);

  const [month, setMonth] = useState<number | "All">(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLeaves(getData("leaves"));
    setMembers((getData("members") as Member[]) || []);
    setLeaveTypes((getData<any>("leaveTypes") || []).map(t => t.name));
  }, []);

  const memberOrgMap = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach(m => {
      map[m.name] = m.organization || "—";
    });
    return map;
  }, [members]);

  const summary = useMemo<SummaryRow[]>(() => {
    const rows: SummaryRow[] = members.map(m => ({
      member: m.name,
      organization: m.organization || "—",
      totals: {},
      total: 0,
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

    // Sort by member name (A → Z)
    return rows.sort((a, b) =>
      a.member.localeCompare(b.member)
    );
  }, [leaves, members, leaveTypes, month, year]);

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
            <th className="border p-2 text-left">Organization</th>
            {leaveTypes.map(t => (
              <th key={t} className="border p-2 text-center">
                {t}
              </th>
            ))}
            <th className="border p-2 text-center">Total</th>
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
            </tr>
          ))}

          {summary.length === 0 && (
            <tr>
              <td
                colSpan={leaveTypes.length + 3}
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
