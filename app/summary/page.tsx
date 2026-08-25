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
  managedBy: string;
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
  overrides: any[],
  member: any,
  year: number,
  month: number
) {
  let applicableHolidays = holidays.filter(h => {
    const d = new Date(h.date);

    return (
      h.location === member.location &&
      h.organization === member.organization &&
      d.getFullYear() === year &&
      d.getMonth() === month &&
      d.getDay() !== 0 &&
      d.getDay() !== 6 &&
      (!member.projectStartDate || h.date >= member.projectStartDate) &&
      (!member.lastWorkingDay || h.date <= member.lastWorkingDay)
    );
  });

  const memberOverrides = overrides.filter(
    o => o.memberId === member.id
  );

  // Remove overridden holidays
  applicableHolidays =
    applicableHolidays.filter(
      h =>
        !memberOverrides.some(
          o =>
            o.action === "Remove" &&
            o.holidayDate === h.date &&
            o.holidayName === h.name
        )
    );

  // Add custom holidays
  const addedHolidays = memberOverrides
    .filter(o => o.action === "Add")
    .filter(o => {
      const d = new Date(o.holidayDate);

      return (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDay() !== 0 &&
        d.getDay() !== 6 &&
        (!member.projectStartDate ||
          o.holidayDate >= member.projectStartDate) &&
        (!member.lastWorkingDay ||
          o.holidayDate <= member.lastWorkingDay)
      );
    });

  return (
    applicableHolidays.length +
    addedHolidays.length
  );
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
  const [memberHolidayOverrides, setMemberHolidayOverrides] = useState<any[]>([]);

  const [month, setMonth] = useState<number | "All">(currentMonth);
  const [year, setYear] = useState(currentYear);

  const [selectedMember, setSelectedMember] =
    useState("All Members");

  const [selectedOrg, setSelectedOrg] =
    useState("All Leave Organizations");

  const [selectedManager, setSelectedManager] =
    useState("All Managers");

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

    setMemberHolidayOverrides(getData("memberHolidayOverrides") || []);
    
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

  const updateApproval = (
    member: string,
    status: ApprovalStatus
  ) => {
    const key = approvalKey(member);

    const updated = {
      ...approvalMap,
      [key]: status,
    };

    setApprovalMap(updated);

    saveData("approvalStatus", updated as unknown as any[]);
  };

  const summary = useMemo<SummaryRow[]>(() => {
    const rows: SummaryRow[] = members
      .filter(m =>
        (selectedMember === "All Members" ||
          m.name === selectedMember) &&

        (selectedOrg === "All Leave Organizations" ||
          m.organization === selectedOrg) &&

        (selectedManager === "All Managers" ||
          m.managedBy === selectedManager)
      )
      .map(m => ({
        member: m.name,
        organization: m.organization || "—",
        managedBy: m.managedBy || "—",
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

      const memberObj = members.find(m => m.name === l.memberName);

      if (memberObj) {
        const leaveStart = new Date(l.startDate);
        const leaveEnd = new Date(l.endDate);

        if (
          memberObj.projectStartDate &&
          leaveEnd < new Date(memberObj.projectStartDate)
        ) {
          return;
        }

        if (
          memberObj.lastWorkingDay &&
          leaveStart > new Date(memberObj.lastWorkingDay)
        ) {
          return;
        }
      }

      row.totals[l.leaveType] += l.ptoDays;
      row.totalLeaves += l.ptoDays;
    });

    rows.forEach(r => {
      if (month === "All") return;

      const memberObj = members.find(m => m.name === r.member);

      if (!memberObj) return;

      const holidayCount = getHolidayCount(
        holidays,
        memberHolidayOverrides,
        memberObj,
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

      if (!memberObj) return;

      let weekdays = 0;
      const date = new Date(year, month, 1);

      while (date.getMonth() === month) {
        const day = date.getDay();

        if (day !== 0 && day !== 6) {
          const isoDate =
            `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}-${String(
              date.getDate()
            ).padStart(2, "0")}`;

          const withinStart =
            !memberObj.projectStartDate ||
            isoDate >= memberObj.projectStartDate;

          const withinEnd =
            !memberObj.lastWorkingDay ||
            isoDate <= memberObj.lastWorkingDay;

          if (withinStart && withinEnd) {
            weekdays++;
          }
        }

        date.setDate(date.getDate() + 1);
      }

      r.workingDays = weekdays;

      r.effectiveWorkDays = Math.max(
        weekdays - r.totalLeaves,
        0
      );
    });

    return rows.sort((a, b) =>
      a.member.localeCompare(b.member)
    );
  }, [
    leaves,
    members,
    memberHolidayOverrides,
    leaveTypes,
    month,
    year,
    approvalMap,
    holidays,
    selectedMember,
    selectedOrg,
    selectedManager,
  ]);

  const years = Array.from(
    new Set(
      leaves.map(l =>
        new Date(l.startDate).getFullYear()
      )
    )
  ).sort();

  const memberOptions = [
    "All Members",
    ...members.map(m => m.name).sort(),
  ];

  const orgOptions = [
    "All Leave Organizations",
    ...Array.from(
      new Set(members.map(m => m.organization))
    ).sort(),
  ];

  const managerOptions = [
    "All Managers",
    ...Array.from(
      new Set(
        members
          .map(m => m.managedBy)
          .filter(Boolean)
      )
    ).sort(),
  ];

  const selectedMemberObj =
    selectedMember === "All Members"
      ? null
      : members.find(m => m.name === selectedMember);

  const totalWorkingDays =
    month === "All"
      ? null
      : selectedMemberObj
      ? (() => {
          let count = 0;
          const date = new Date(year, month, 1);

          while (date.getMonth() === month) {
            const day = date.getDay();

            if (day !== 0 && day !== 6) {
              const isoDate =
                `${date.getFullYear()}-${String(
                  date.getMonth() + 1
                ).padStart(2, "0")}-${String(
                  date.getDate()
                ).padStart(2, "0")}`;

              const withinStart =
                !selectedMemberObj.projectStartDate ||
                isoDate >= selectedMemberObj.projectStartDate;

              const withinEnd =
                !selectedMemberObj.lastWorkingDay ||
                isoDate <= selectedMemberObj.lastWorkingDay;

              if (withinStart && withinEnd) {
                count++;
              }
            }

            date.setDate(date.getDate() + 1);
          }

          return count;
        })()
      : getWeekdays(year, month);

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-bold mb-4">
        Summary View (Confirmed Leaves)
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
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
            <option key={m} value={i}>
              {m}
            </option>
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

        <select
          className="border p-2"
          value={selectedMember}
          onChange={e => setSelectedMember(e.target.value)}
        >
          {memberOptions.map(m => (
            <option key={m}>{m}</option>
          ))}
        </select>

        <select
          className="border p-2"
          value={selectedOrg}
          onChange={e => setSelectedOrg(e.target.value)}
        >
          {orgOptions.map(o => (
            <option key={o}>{o || "—"}</option>
          ))}
        </select>

        <select
          className="border p-2"
          value={selectedManager}
          onChange={e => setSelectedManager(e.target.value)}
        >
          {managerOptions.map(m => (
            <option key={m}>{m}</option>
          ))}
        </select>

        <button
          onClick={() => {
            setMonth(currentMonth);
            setYear(currentYear);
            setSelectedMember("All Members");
            setSelectedOrg("All Leave Organizations");
            setSelectedManager("All Managers");
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
      <table className="w-full border border-gray-200 rounded overflow-hidden">
        <thead className="bg-gray-100 text-sm font-semibold">
          <tr>
            <th className="px-4 py-3 text-left">
              Team Member
            </th>

            <th className="px-4 py-3 text-left">
              Leave Organization
            </th>

            <th className="px-4 py-3 text-left">
              Managed By
            </th>

            {leaveTypes.map(t => (
              <th
                key={t}
                className="px-4 py-3 text-center"
              >
                {t}
              </th>
            ))}

            <th className="px-4 py-3 text-center">
              Total Leaves
            </th>

            <th className="px-4 py-3 text-center">
              Effective Work Days
            </th>

            <th className="px-4 py-3 text-center">
              Approval Status
            </th>
          </tr>
        </thead>

        <tbody>
          {summary.map((r, idx) => (
            <tr
              key={r.member}
              className={
                idx % 2 === 0
                  ? "bg-white"
                  : "bg-gray-50"
              }
            >
              <td className="px-4 py-3 text-left">
                {r.member}
              </td>

              <td className="px-4 py-3 text-left">
                {r.organization}
              </td>

              <td className="px-4 py-3 text-left">
                {r.managedBy}
              </td>

              {leaveTypes.map(t => (
                <td
                  key={t}
                  className="px-4 py-3 text-center"
                >
                  {r.totals[t]}
                </td>
              ))}

              <td className="px-4 py-3 text-center">
                {r.totalLeaves}
              </td>

              <td className="px-4 py-3 text-center">
                {r.effectiveWorkDays ?? "—"}
              </td>

              <td className="px-4 py-3 text-center">
                <select
                  value={r.approvalStatus}
                  onChange={e =>
                    updateApproval(
                      r.member,
                      e.target.value as ApprovalStatus
                    )
                  }
                  className={`px-3 py-1 rounded text-sm ${
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
