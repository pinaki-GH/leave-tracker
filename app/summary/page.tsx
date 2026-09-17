"use client";

import { useEffect, useMemo, useState } from "react";
import { Leave } from "@/lib/types";
import { getData, saveData } from "@/lib/storage";

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const quarters = [
  { value: 1, label: "Q1 (Jan-Mar)", startMonth: 0, endMonth: 2 },
  { value: 2, label: "Q2 (Apr-Jun)", startMonth: 3, endMonth: 5 },
  { value: 3, label: "Q3 (Jul-Sep)", startMonth: 6, endMonth: 8 },
  { value: 4, label: "Q4 (Oct-Dec)", startMonth: 9, endMonth: 11 },
];

type Quarter = 1 | 2 | 3 | 4;
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
  approvalApplicable: boolean;
};

/* ================= HELPERS ================= */

function parseDateOnly(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isMonthOutsideProjectPeriod(
  member: any,
  year: number,
  month: number | "All"
) {
  // "All Months" covers multiple months, so retain the existing
  // approval-status workflow rather than marking the row N/A.
  if (month === "All") return false;

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  if (member.projectStartDate) {
    const projectStart = parseDateOnly(member.projectStartDate);
    if (monthEnd < projectStart) return true;
  }

  if (member.lastWorkingDay) {
    const projectEnd = parseDateOnly(member.lastWorkingDay);
    if (monthStart > projectEnd) return true;
  }

  return false;
}

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

function getHolidayDates(
  holidays: Holiday[],
  overrides: any[],
  member: any,
  year: number,
  month: number
): Set<string> {
  let applicableHolidays = holidays.filter(h => {
    const d = parseDateOnly(h.date);

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

  // Remove overridden holidays.
  applicableHolidays = applicableHolidays.filter(
    h =>
      !memberOverrides.some(
        o =>
          o.action === "Remove" &&
          o.holidayDate === h.date &&
          o.holidayName === h.name
      )
  );

  const dates = new Set<string>(
    applicableHolidays.map(h => h.date)
  );

  // Add custom holidays.
  memberOverrides
    .filter(o => o.action === "Add")
    .forEach(o => {
      const d = parseDateOnly(o.holidayDate);

      if (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDay() !== 0 &&
        d.getDay() !== 6 &&
        (!member.projectStartDate ||
          o.holidayDate >= member.projectStartDate) &&
        (!member.lastWorkingDay ||
          o.holidayDate <= member.lastWorkingDay)
      ) {
        dates.add(o.holidayDate);
      }
    });

  return dates;
}

function getHolidayCount(
  holidays: Holiday[],
  overrides: any[],
  member: any,
  year: number,
  month: number
) {
  return getHolidayDates(
    holidays,
    overrides,
    member,
    year,
    month
  ).size;
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
  const [quarter, setQuarter] = useState<Quarter | "All">("All");
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

  const approvalKey = (
    member: string,
    targetMonth: number | "All" = month
  ) => `${year}-${targetMonth}-${member}`;

  const getSelectedPeriod = () => {
    if (quarter !== "All") {
      const selectedQuarter = quarters.find(q => q.value === quarter)!;
      return {
        startMonth: selectedQuarter.startMonth,
        endMonth: selectedQuarter.endMonth,
      };
    }

    if (month !== "All") {
      return {
        startMonth: month,
        endMonth: month,
      };
    }

    return {
      startMonth: 0,
      endMonth: 11,
    };
  };

  const updateApproval = (
    member: string,
    status: ApprovalStatus
  ) => {
    const { startMonth, endMonth } = getSelectedPeriod();
    const updated = { ...approvalMap };

    // Approval status remains stored month-by-month. For a quarter view,
    // apply the selected status to each month in that quarter.
    for (let targetMonth = startMonth; targetMonth <= endMonth; targetMonth++) {
      updated[approvalKey(member, targetMonth)] = status;
    }

    setApprovalMap(updated);
    saveData("approvalStatus", updated as unknown as any[]);
  };

  const summary = useMemo<SummaryRow[]>(() => {
    const { startMonth, endMonth } = getSelectedPeriod();
    const periodStart = new Date(year, startMonth, 1);
    const periodEnd = new Date(year, endMonth + 1, 0);

    const rows: SummaryRow[] = members
      .filter(m =>
        (selectedMember === "All Members" || m.name === selectedMember) &&
        (selectedOrg === "All Leave Organizations" ||
          m.organization === selectedOrg) &&
        (selectedManager === "All Managers" || m.managedBy === selectedManager)
      )
      .map(m => {
        const applicableStatuses: ApprovalStatus[] = [];

        for (let targetMonth = startMonth; targetMonth <= endMonth; targetMonth++) {
          if (!isMonthOutsideProjectPeriod(m, year, targetMonth)) {
            applicableStatuses.push(
              approvalMap[approvalKey(m.name, targetMonth)] || "Pending"
            );
          }
        }

        return {
          member: m.name,
          organization: m.organization || "—",
          managedBy: m.managedBy || "—",
          totals: {},
          totalLeaves: 0,
          workingDays: null,
          effectiveWorkDays: null,
          approvalStatus:
            applicableStatuses.length > 0 &&
            applicableStatuses.every(status => status === "Approved")
              ? "Approved"
              : "Pending",
          approvalApplicable: applicableStatuses.length > 0,
        };
      });

    rows.forEach(r => {
      leaveTypes.forEach(t => (r.totals[t] = 0));
    });

    leaves.forEach(l => {
      if (l.status !== "Confirmed") return;

      const leaveStart = parseDateOnly(l.startDate);
      const leaveEnd = parseDateOnly(l.endDate);

      if (leaveEnd < periodStart || leaveStart > periodEnd) return;

      const row = rows.find(r => r.member === l.memberName);
      if (!row) return;

      const memberObj = members.find(m => m.name === l.memberName);

      let effectiveStart = new Date(leaveStart);
      let effectiveEnd = new Date(leaveEnd);

      if (memberObj?.projectStartDate) {
        const projectStart = parseDateOnly(memberObj.projectStartDate);
        if (effectiveEnd < projectStart) return;
        if (effectiveStart < projectStart) effectiveStart = projectStart;
      }

      if (memberObj?.lastWorkingDay) {
        const projectEnd = parseDateOnly(memberObj.lastWorkingDay);
        if (effectiveStart > projectEnd) return;
        if (effectiveEnd > projectEnd) effectiveEnd = projectEnd;
      }

      if (effectiveStart < periodStart) effectiveStart = periodStart;
      if (effectiveEnd > periodEnd) effectiveEnd = periodEnd;
      if (effectiveStart > effectiveEnd) return;

      /*
       * Company Holiday takes precedence over Personal Leave.
       * Build the applicable holiday-date set for the selected period
       * and exclude those dates from the personal-leave PTO calculation.
       */
      const companyHolidayDates = new Set<string>();

      for (
        let targetMonth = effectiveStart.getMonth();
        targetMonth <= effectiveEnd.getMonth() ||
        (effectiveStart.getFullYear() !== effectiveEnd.getFullYear() &&
          targetMonth <= 11);
        targetMonth++
      ) {
        const targetYear =
          effectiveStart.getFullYear() +
          Math.floor(targetMonth / 12);

        const normalizedMonth = targetMonth % 12;

        if (targetYear > effectiveEnd.getFullYear()) break;
        if (
          targetYear === effectiveEnd.getFullYear() &&
          normalizedMonth > effectiveEnd.getMonth()
        ) {
          break;
        }

        const holidayDates = getHolidayDates(
          holidays,
          memberHolidayOverrides,
          memberObj,
          targetYear,
          normalizedMonth
        );

        holidayDates.forEach(date => companyHolidayDates.add(date));

        if (targetYear === effectiveEnd.getFullYear() &&
            normalizedMonth === effectiveEnd.getMonth()) {
          break;
        }
      }

      let calculatedPtoDays = 0;
      const current = new Date(effectiveStart);

      while (current <= effectiveEnd) {
        const day = current.getDay();

        const isoDate =
          `${current.getFullYear()}-${String(
            current.getMonth() + 1
          ).padStart(2, "0")}-${String(
            current.getDate()
          ).padStart(2, "0")}`;

        if (
          day !== 0 &&
          day !== 6 &&
          !companyHolidayDates.has(isoDate)
        ) {
          calculatedPtoDays++;
        }

        current.setDate(current.getDate() + 1);
      }

      /*
       * For a leave record entered as a full-day plan, use the calculated
       * number of applicable working days after excluding Company Holidays.
       * For partial-day records, retain the entered PTO value but never
       * allow it to exceed the applicable working days.
       */
      let applicablePtoDays = Math.min(
        l.ptoDays,
        calculatedPtoDays
      );

      row.totals[l.leaveType] += applicablePtoDays;
      row.totalLeaves += applicablePtoDays;
    });

    rows.forEach(r => {
      const memberObj = members.find(m => m.name === r.member);
      if (!memberObj) return;

      let holidayCount = 0;
      for (let targetMonth = startMonth; targetMonth <= endMonth; targetMonth++) {
        holidayCount += getHolidayCount(
          holidays,
          memberHolidayOverrides,
          memberObj,
          year,
          targetMonth
        );
      }

      r.totalLeaves += holidayCount;

      if (!r.totals["Company Holiday"]) {
        r.totals["Company Holiday"] = 0;
      }
      r.totals["Company Holiday"] += holidayCount;
    });

    rows.forEach(r => {
      const memberObj = members.find(m => m.name === r.member);
      if (!memberObj) return;

      let weekdays = 0;
      const date = new Date(periodStart);

      while (date <= periodEnd) {
        const day = date.getDay();

        if (day !== 0 && day !== 6) {
          const isoDate =
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
              date.getDate()
            ).padStart(2, "0")}`;

          const withinStart =
            !memberObj.projectStartDate ||
            isoDate >= memberObj.projectStartDate;

          const withinEnd =
            !memberObj.lastWorkingDay ||
            isoDate <= memberObj.lastWorkingDay;

          if (withinStart && withinEnd) weekdays++;
        }

        date.setDate(date.getDate() + 1);
      }

      r.workingDays = weekdays;
      r.effectiveWorkDays = Math.max(weekdays - r.totalLeaves, 0);
    });

    return rows.sort((a, b) => a.member.localeCompare(b.member));
  }, [
    leaves,
    members,
    memberHolidayOverrides,
    leaveTypes,
    month,
    quarter,
    year,
    approvalMap,
    holidays,
    selectedMember,
    selectedOrg,
    selectedManager,
  ]);

  const years = Array.from(
    new Set(
      leaves.flatMap(l => {
        const startYear = new Date(l.startDate).getFullYear();
        const endYear = new Date(l.endDate).getFullYear();

        return startYear === endYear
          ? [startYear]
          : [startYear, endYear];
      })
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
    (() => {
      const { startMonth, endMonth } = getSelectedPeriod();
      const periodStart = new Date(year, startMonth, 1);
      const periodEnd = new Date(year, endMonth + 1, 0);

      let count = 0;

      if (selectedMemberObj) {
        const date = new Date(periodStart);

        while (date <= periodEnd) {
          const day = date.getDay();

          if (day !== 0 && day !== 6) {
            const isoDate =
              `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
                date.getDate()
              ).padStart(2, "0")}`;

            const withinStart =
              !selectedMemberObj.projectStartDate ||
              isoDate >= selectedMemberObj.projectStartDate;

            const withinEnd =
              !selectedMemberObj.lastWorkingDay ||
              isoDate <= selectedMemberObj.lastWorkingDay;

            if (withinStart && withinEnd) count++;
          }

          date.setDate(date.getDate() + 1);
        }

        return count;
      }

      for (let targetMonth = startMonth; targetMonth <= endMonth; targetMonth++) {
        count += getWeekdays(year, targetMonth);
      }

      return count;
    })();

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
          onChange={e => {
            const value =
              e.target.value === "All"
                ? "All"
                : Number(e.target.value);

            setMonth(value);
            if (value !== "All") setQuarter("All");
          }}
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
          value={quarter}
          onChange={e => {
            const value =
              e.target.value === "All"
                ? "All"
                : Number(e.target.value) as Quarter;

            setQuarter(value);
            if (value !== "All") setMonth("All");
          }}
        >
          <option value="All">All Quarters</option>

          {quarters.map(q => (
            <option key={q.value} value={q.value}>
              {q.label}
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
            setQuarter("All");
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
      {(month !== "All" || quarter !== "All") && (
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
                {!r.approvalApplicable ? (
                  <span className="px-3 py-1 rounded text-sm bg-gray-100 text-gray-500">
                    N/A
                  </span>
                ) : (
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
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
