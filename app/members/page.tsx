"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { getData, saveData } from "@/lib/storage";

/* ================= TYPES ================= */

type Member = {
  id: string;
  name: string;
  organization: string;
  location: string;
  managedBy: string;
  projectStartDate?: string;
  lastWorkingDay?: string;
};

type LeaveType = {
  id: string;
  name: string;
};

type Holiday = {
  id: string;
  organization: string;
  location: string;
  date: string;
  name: string;
};

type MemberHolidayOverride = {
  id: string;
  memberId: string;
  holidayName: string;
  holidayDate: string;
  action: "Add" | "Remove";
};

/* ================= COMPONENT ================= */

export default function MembersPage() {
  const [activeTab, setActiveTab] = useState<
  "members" | "leaveTypes" | "holidays" | "customHolidays"
  >("members");

  const [members, setMembers] = useState<Member[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [newName, setNewName] = useState("");
  const [newOrg, setNewOrg] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newManagedBy, setNewManagedBy] = useState("");
  const [newProjectStartDate, setNewProjectStartDate] = useState("");
  const [newLastWorkingDay, setNewLastWorkingDay] = useState("");

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMember, setEditMember] = useState<Partial<Member>>({});

  const [newLeaveType, setNewLeaveType] = useState("");
  const [editingLeaveTypeId, setEditingLeaveTypeId] = useState<string | null>(
    null
  );
  const [editLeaveTypeName, setEditLeaveTypeName] = useState("");

  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayLocation, setNewHolidayLocation] = useState("");
  const [newHolidayOrg, setNewHolidayOrg] = useState("");

  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [editHoliday, setEditHoliday] = useState<Partial<Holiday>>({});

  const [selectedHolidayOrg, setSelectedHolidayOrg] = useState(
    "All Leave Organizations"
  );

  const [selectedHolidayLocation, setSelectedHolidayLocation] =
    useState("All Locations");

  const [memberHolidayOverrides, setMemberHolidayOverrides] =
  useState<MemberHolidayOverride[]>([]);

  const [overrideMemberId, setOverrideMemberId] = useState("");
  const [overrideHolidayName, setOverrideHolidayName] = useState("");
  const [overrideHolidayDate, setOverrideHolidayDate] = useState("");

  const [overrideAction, setOverrideAction] = useState<
    "Add" | "Remove"
    >("Add");

  const [editingOverrideId, setEditingOverrideId] =
  useState<string | null>(null);

  const [editOverride, setEditOverride] =
  useState<Partial<MemberHolidayOverride>>({});

  useEffect(() => {
    const storedMembers = (getData("members") as Partial<Member>[]) || [];

    setMembers(
      storedMembers.map(m => ({
        id: m.id!,
        name: m.name!,
        organization: m.organization || "",
        location: m.location || "",
        managedBy: m.managedBy || "",
        projectStartDate: m.projectStartDate || "",
        lastWorkingDay: m.lastWorkingDay || "",
      }))
    );

    setLeaveTypes((getData("leaveTypes") as LeaveType[]) || []);

    const storedHolidays = (getData("companyHolidays") as any[]) || [];

    setHolidays(
      storedHolidays.map(h => ({
        ...h,
        organization: h.organization || "",
      }))
    );
    setMemberHolidayOverrides(
    (getData(
    "memberHolidayOverrides"
    ) as MemberHolidayOverride[]) || []
    );
    
    }, []);

  const saveMembers = (data: Member[]) => {
    setMembers(data);
    saveData("members", data);
  };

  const saveLeaveTypes = (data: LeaveType[]) => {
    setLeaveTypes(data);
    saveData("leaveTypes", data);
  };

  const saveHolidays = (data: Holiday[]) => {
    setHolidays(data);
    saveData("companyHolidays", data);
  };

  const saveOverrides = (data: MemberHolidayOverride[]) => {
    setMemberHolidayOverrides(data);
    saveData("memberHolidayOverrides", data);
  };
  
  const locations = Array.from(
    new Set([
      ...members.map(m => m.location),
      ...holidays.map(h => h.location),
    ])
  )
    .filter(Boolean)
    .sort();

  /* ================= MEMBERS ================= */

  const addMember = () => {
    if (!newName.trim()) return;

    saveMembers([
      ...members,
      {
        id: crypto.randomUUID(),
        name: newName.trim(),
        organization: newOrg.trim(),
        location: newLocation.trim(),
        managedBy: newManagedBy.trim(),
        projectStartDate: newProjectStartDate,
        lastWorkingDay: newLastWorkingDay,
      },
    ]);

    setNewName("");
    setNewOrg("");
    setNewLocation("");
    setNewManagedBy("");
    setNewProjectStartDate("");
    setNewLastWorkingDay("");
  };

  const updateMember = () => {
    if (!editingMemberId || !editMember.name?.trim()) return;

    saveMembers(
      members.map(m =>
        m.id === editingMemberId
          ? {
              ...m,
              name: editMember.name!,
              organization: editMember.organization || "",
              location: editMember.location || "",
              managedBy: editMember.managedBy || "",
              projectStartDate: editMember.projectStartDate || "",
              lastWorkingDay: editMember.lastWorkingDay || "",
            }
          : m
      )
    );

    setEditingMemberId(null);
    setEditMember({});
  };

  const deleteMember = (id: string) => {
    saveMembers(members.filter(m => m.id !== id));
  };

  const normalizeExcelDate = (value: unknown): string => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      // Excel date cells are calendar dates, not timestamps. Use UTC
      // components so the date does not shift because of the browser timezone.
      const year = value.getUTCFullYear();
      const month = String(value.getUTCMonth() + 1).padStart(2, "0");
      const day = String(value.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) {
        return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(
          parsed.d
        ).padStart(2, "0")}`;
      }
    }

    const text = String(value ?? "").trim();
    if (!text) return "";

    const isoMatch = text.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
    }

    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    return text;
  };

  const importMembersFromExcel = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      const sheet = workbook.Sheets["Members"];

      if (!sheet) {
        alert('The Excel workbook must contain a sheet named "Members".');
        return;
      }

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      const requiredHeaders = [
        "Name",
        "Leave Organization",
        "Location",
        "Managed By",
        "Project Start Date",
        "Last Working Day",
      ];

      const headerRow = XLSX.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        defval: "",
        range: 0,
      })[0] || [];

      const missingHeaders = requiredHeaders.filter(
        header => !headerRow.some(cell => String(cell).trim() === header)
      );

      if (missingHeaders.length > 0) {
        alert(
          `The Members sheet is missing these required columns: ${missingHeaders.join(
            ", "
          )}`
        );
        return;
      }

      const importedMembers: Member[] = [];
      const errors: string[] = [];

      rows.forEach((row, index) => {
        const rowNumber = index + 2;
        const name = String(row["Name"] ?? "").trim();
        const organization = String(
          row["Leave Organization"] ?? ""
        ).trim();
        const location = String(row["Location"] ?? "").trim();
        const managedBy = String(row["Managed By"] ?? "").trim();
        const projectStartDate = normalizeExcelDate(
          row["Project Start Date"]
        );
        const lastWorkingDay = normalizeExcelDate(row["Last Working Day"]);

        const rowHasData = [
          name,
          organization,
          location,
          managedBy,
          projectStartDate,
          lastWorkingDay,
        ].some(Boolean);

        if (!rowHasData) return;

        if (!name) {
          errors.push(`Row ${rowNumber}: Name is required.`);
          return;
        }

        if (
          projectStartDate &&
          lastWorkingDay &&
          projectStartDate > lastWorkingDay
        ) {
          errors.push(
            `Row ${rowNumber}: Project Start Date cannot be after Last Working Day.`
          );
          return;
        }

        importedMembers.push({
          id: crypto.randomUUID(),
          name,
          organization,
          location,
          managedBy,
          projectStartDate,
          lastWorkingDay,
        });
      });

      if (errors.length > 0) {
        alert(
          `Import could not be completed because some rows are invalid:\n\n${errors.join(
            "\n"
          )}`
        );
        return;
      }

      if (importedMembers.length === 0) {
        alert("No member records were found in the Members sheet.");
        return;
      }

      const existingByName = new Map(
        members.map(member => [member.name.trim().toLowerCase(), member])
      );

      const importedByName = new Map<string, Member>();
      importedMembers.forEach(member => {
        importedByName.set(member.name.trim().toLowerCase(), member);
      });

      const mergedMembers = members.map(member => {
        const imported = importedByName.get(member.name.trim().toLowerCase());

        if (!imported) return member;

        return {
          ...member,
          name: imported.name,
          organization: imported.organization,
          location: imported.location,
          managedBy: imported.managedBy,
          projectStartDate: imported.projectStartDate,
          lastWorkingDay: imported.lastWorkingDay,
        };
      });

      importedMembers.forEach(member => {
        const key = member.name.trim().toLowerCase();
        if (!existingByName.has(key)) {
          mergedMembers.push(member);
        }
      });

      saveMembers(mergedMembers);

      alert(
        `${importedMembers.length} member record${
          importedMembers.length === 1 ? "" : "s"
        } imported successfully.`
      );
    } catch (error) {
      console.error("Member Excel import failed:", error);
      alert(
        "The Excel file could not be imported. Please make sure it is a valid .xlsx or .xls file using the provided Members template."
      );
    }
  };

  const importLeaveTypesFromExcel = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      const sheet = workbook.Sheets["Leave Types"];

      if (!sheet) {
        alert('The Excel workbook must contain a sheet named "Leave Types".');
        return;
      }

      const headerRow = XLSX.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        defval: "",
        range: 0,
      })[0] || [];

      if (!headerRow.some(cell => String(cell).trim() === "Leave Type")) {
        alert('The "Leave Types" sheet must contain a column named "Leave Type".');
        return;
      }

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      const importedNames: string[] = [];
      const errors: string[] = [];

      rows.forEach((row, index) => {
        const rowNumber = index + 2;
        const name = String(row["Leave Type"] ?? "").trim();

        if (!name) {
          const rowHasData = Object.values(row).some(
            value => String(value ?? "").trim() !== ""
          );
          if (rowHasData) {
            errors.push(`Row ${rowNumber}: Leave Type is required.`);
          }
          return;
        }

        importedNames.push(name);
      });

      if (errors.length > 0) {
        alert(
          `Import could not be completed because some rows are invalid:\n\n${errors.join(
            "\n"
          )}`
        );
        return;
      }

      const uniqueImportedNames = Array.from(
        new Map(
          importedNames.map(name => [name.trim().toLowerCase(), name.trim()])
        ).values()
      );

      if (uniqueImportedNames.length === 0) {
        alert("No leave type records were found in the Leave Types sheet.");
        return;
      }

      const existingByName = new Map(
        leaveTypes.map(type => [type.name.trim().toLowerCase(), type])
      );

      const mergedLeaveTypes = [...leaveTypes];
      let addedCount = 0;
      let updatedCount = 0;

      uniqueImportedNames.forEach(name => {
        const key = name.toLowerCase();
        const existing = existingByName.get(key);

        if (existing) {
          if (existing.name !== name) {
            const index = mergedLeaveTypes.findIndex(
              type => type.id === existing.id
            );
            if (index >= 0) {
              mergedLeaveTypes[index] = { ...existing, name };
              updatedCount++;
            }
          }
        } else {
          mergedLeaveTypes.push({
            id: crypto.randomUUID(),
            name,
          });
          addedCount++;
        }
      });

      saveLeaveTypes(mergedLeaveTypes);

      const summary = [
        `${uniqueImportedNames.length} leave type${
          uniqueImportedNames.length === 1 ? "" : "s"
        } processed successfully.`,
        addedCount > 0 ? `${addedCount} added.` : "",
        updatedCount > 0 ? `${updatedCount} updated.` : "",
        addedCount === 0 && updatedCount === 0
          ? "No existing records needed to be changed."
          : "",
      ]
        .filter(Boolean)
        .join(" ");

      alert(summary);
    } catch (error) {
      console.error("Leave Type Excel import failed:", error);
      alert(
        "The Excel file could not be imported. Please make sure it is a valid .xlsx or .xls file using the provided master-data template."
      );
    }
  };

  const importCompanyHolidaysFromExcel = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      const sheet = workbook.Sheets["Company Holidays"];

      if (!sheet) {
        alert(
          'The Excel workbook must contain a sheet named "Company Holidays".'
        );
        return;
      }

      const requiredHeaders = [
        "Holiday Name",
        "Date",
        "Organization",
        "Location",
      ];

      const headerRow = XLSX.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        defval: "",
        range: 0,
      })[0] || [];

      const missingHeaders = requiredHeaders.filter(
        header => !headerRow.some(cell => String(cell).trim() === header)
      );

      if (missingHeaders.length > 0) {
        alert(
          `The Company Holidays sheet is missing these required columns: ${missingHeaders.join(
            ", "
          )}`
        );
        return;
      }

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      const importedHolidays: Holiday[] = [];
      const errors: string[] = [];

      rows.forEach((row, index) => {
        const rowNumber = index + 2;
        const name = String(row["Holiday Name"] ?? "").trim();
        const date = normalizeExcelDate(row["Date"]);
        const organization = String(row["Organization"] ?? "").trim();
        const location = String(row["Location"] ?? "").trim();

        const rowHasData = [
          name,
          date,
          organization,
          location,
        ].some(Boolean);

        if (!rowHasData) return;

        const rowErrors: string[] = [];

        if (!name) rowErrors.push("Holiday Name is required.");
        if (!date) rowErrors.push("Date is required.");
        if (!organization) rowErrors.push("Organization is required.");
        if (!location) rowErrors.push("Location is required.");

        if (rowErrors.length > 0) {
          errors.push(`Row ${rowNumber}: ${rowErrors.join(" ")}`);
          return;
        }

        importedHolidays.push({
          id: crypto.randomUUID(),
          name,
          date,
          organization,
          location,
        });
      });

      if (errors.length > 0) {
        alert(
          `Import could not be completed because some rows are invalid:\n\n${errors.join(
            "\n"
          )}`
        );
        return;
      }

      if (importedHolidays.length === 0) {
        alert("No company holiday records were found in the Company Holidays sheet.");
        return;
      }

      // Treat Date + Organization + Location as the natural key for a holiday.
      // This allows a re-import to update an existing holiday rather than creating
      // duplicate records, while preserving the application's existing ID.
      const existingByKey = new Map(
        holidays.map(holiday => [
          `${holiday.date}|${holiday.organization.trim().toLowerCase()}|${holiday.location
            .trim()
            .toLowerCase()}`,
          holiday,
        ])
      );

      const importedByKey = new Map<string, Holiday>();
      importedHolidays.forEach(holiday => {
        const key = `${holiday.date}|${holiday.organization
          .trim()
          .toLowerCase()}|${holiday.location.trim().toLowerCase()}`;
        importedByKey.set(key, holiday);
      });

      const mergedHolidays = holidays.map(holiday => {
        const key = `${holiday.date}|${holiday.organization
          .trim()
          .toLowerCase()}|${holiday.location.trim().toLowerCase()}`;
        const imported = importedByKey.get(key);

        if (!imported) return holiday;

        return {
          ...holiday,
          name: imported.name,
          date: imported.date,
          organization: imported.organization,
          location: imported.location,
        };
      });

      let addedCount = 0;
      let updatedCount = 0;

      importedByKey.forEach((holiday, key) => {
        if (existingByKey.has(key)) {
          updatedCount++;
        } else {
          mergedHolidays.push(holiday);
          addedCount++;
        }
      });

      saveHolidays(mergedHolidays);

      const summary = [
        `${importedByKey.size} company holiday record${
          importedByKey.size === 1 ? "" : "s"
        } processed successfully.`,
        addedCount > 0 ? `${addedCount} added.` : "",
        updatedCount > 0 ? `${updatedCount} updated.` : "",
        addedCount === 0 && updatedCount === 0
          ? "No existing records needed to be changed."
          : "",
      ]
        .filter(Boolean)
        .join(" ");

      alert(summary);
    } catch (error) {
      console.error("Company Holiday Excel import failed:", error);
      alert(
        "The Excel file could not be imported. Please make sure it is a valid .xlsx or .xls file using the provided master-data template."
      );
    }
  };

  /* ================= LEAVE TYPES ================= */

  const addLeaveType = () => {
    if (!newLeaveType.trim()) return;

    saveLeaveTypes([
      ...leaveTypes,
      { id: crypto.randomUUID(), name: newLeaveType.trim() },
    ]);

    setNewLeaveType("");
  };

  const updateLeaveType = () => {
    if (!editingLeaveTypeId || !editLeaveTypeName.trim()) return;

    saveLeaveTypes(
      leaveTypes.map(t =>
        t.id === editingLeaveTypeId
          ? { ...t, name: editLeaveTypeName.trim() }
          : t
      )
    );

    setEditingLeaveTypeId(null);
    setEditLeaveTypeName("");
  };

  const deleteLeaveType = (id: string) => {
    saveLeaveTypes(leaveTypes.filter(t => t.id !== id));
  };

  /* ================= HOLIDAYS ================= */

  const addHoliday = () => {
    if (
      !newHolidayName ||
      !newHolidayDate ||
      !newHolidayLocation ||
      !newHolidayOrg
    )
      return;

    saveHolidays([
      ...holidays,
      {
        id: crypto.randomUUID(),
        name: newHolidayName,
        date: newHolidayDate,
        location: newHolidayLocation,
        organization: newHolidayOrg,
      },
    ]);

    setNewHolidayName("");
    setNewHolidayDate("");
    setNewHolidayLocation("");
    setNewHolidayOrg("");
  };

  const updateHoliday = () => {
    if (!editingHolidayId) return;

    saveHolidays(
      holidays.map(h =>
        h.id === editingHolidayId
          ? {
              ...h,
              name: editHoliday.name || "",
              date: editHoliday.date || "",
              location: editHoliday.location || "",
              organization: editHoliday.organization || "",
            }
          : h
      )
    );

    setEditingHolidayId(null);
    setEditHoliday({});
  };

  const deleteHoliday = (id: string) => {
    saveHolidays(holidays.filter(h => h.id !== id));
  };

  /* ================= CUSTOM HOLIDAYS ================= */

const addOverride = () => {
  if (
    !overrideMemberId ||
    !overrideHolidayName ||
    !overrideHolidayDate
  )
    return;

  saveOverrides([
    ...memberHolidayOverrides,
    {
      id: crypto.randomUUID(),
      memberId: overrideMemberId,
      holidayName: overrideHolidayName,
      holidayDate: overrideHolidayDate,
      action: overrideAction,
    },
  ]);

  setOverrideMemberId("");
  setOverrideHolidayName("");
  setOverrideHolidayDate("");
  setOverrideAction("Add");
};

const updateOverride = () => {
  if (!editingOverrideId) return;

  saveOverrides(
    memberHolidayOverrides.map(o =>
      o.id === editingOverrideId
        ? {
            ...o,
            memberId: editOverride.memberId || "",
            holidayName:
              editOverride.holidayName || "",
            holidayDate:
              editOverride.holidayDate || "",
            action:
              (editOverride.action as
                | "Add"
                | "Remove") || "Add",
          }
        : o
    )
  );

  setEditingOverrideId(null);
  setEditOverride({});
};

const deleteOverride = (id: string) => {
  saveOverrides(
    memberHolidayOverrides.filter(
      o => o.id !== id
    )
  );
};
  
  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b pb-2">
        {["members", "leaveTypes", "holidays", "customHolidays",].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-t ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-100"
            }`}
          >
            {tab === "members" && "Team Members"}
            {tab === "leaveTypes" && "Leave Types"}
            {tab === "holidays" && "Company Holidays"}
            {tab === "customHolidays" &&  "Custom Holidays"}
          </button>
        ))}
      </div>

      {/* MEMBERS */}
      {activeTab === "members" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-bold mb-4">Team Members</h2>

          <div className="flex flex-wrap gap-2 mb-4">
            <label className="bg-gray-100 border px-4 py-2 rounded cursor-pointer">
              Import Members from Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={importMembersFromExcel}
                className="hidden"
              />
            </label>
            <span className="text-sm text-gray-500 self-center">
              Uses the Members sheet from the master-data template
            </span>
          </div>

          <div className="grid md:grid-cols-6 gap-2 mb-4">
            <input
              placeholder="Name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="border p-2"
            />

            <input
              placeholder="Organization"
              value={newOrg}
              onChange={e => setNewOrg(e.target.value)}
              className="border p-2"
            />

            <select
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              className="border p-2"
            >
              <option value="">Select Location</option>

              {locations.map(l => (
                <option key={l}>{l}</option>
              ))}
            </select>

            <input
              placeholder="Managed By"
              value={newManagedBy}
              onChange={e => setNewManagedBy(e.target.value)}
              className="border p-2"
            />

            <input
              type="date"
              value={newProjectStartDate}
              onChange={e => setNewProjectStartDate(e.target.value)}
              className="border p-2"
              title="Project Start Date"
            />

            <input
              type="date"
              value={newLastWorkingDay}
              onChange={e => setNewLastWorkingDay(e.target.value)}
              className="border p-2"
              title="Last Working Day"
            />
          </div>

          <button
            onClick={addMember}
            className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
          >
            Add Member
          </button>

          <table className="w-full border border-gray-200 rounded overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Team Member</th>
                <th className="px-4 py-3 text-left">Leave Organization</th>
                <th className="px-4 py-3 text-left">Work Location</th>
                <th className="px-4 py-3 text-left">Managed By</th>
                <th className="px-4 py-3 text-left">Project Start Date</th>
                <th className="px-4 py-3 text-left">Last Working Day</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {members.map((m, idx) => (
                <tr
                  key={m.id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  {editingMemberId === m.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          value={editMember.name || ""}
                          onChange={e =>
                            setEditMember({
                              ...editMember,
                              name: e.target.value,
                            })
                          }
                          className="border p-2 w-full"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          value={editMember.organization || ""}
                          onChange={e =>
                            setEditMember({
                              ...editMember,
                              organization: e.target.value,
                            })
                          }
                          className="border p-2 w-full"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={editMember.location || ""}
                          onChange={e =>
                            setEditMember({
                              ...editMember,
                              location: e.target.value,
                            })
                          }
                          className="border p-2 w-full"
                        >
                          <option value="">Select Location</option>

                          {locations.map(l => (
                            <option key={l}>{l}</option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <input
                          value={editMember.managedBy || ""}
                          onChange={e =>
                            setEditMember({
                              ...editMember,
                              managedBy: e.target.value,
                            })
                          }
                          className="border p-2 w-full"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={editMember.projectStartDate || ""}
                          onChange={e =>
                            setEditMember({
                              ...editMember,
                              projectStartDate: e.target.value,
                            })
                          }
                          className="border p-2 w-full"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={editMember.lastWorkingDay || ""}
                          onChange={e =>
                            setEditMember({
                              ...editMember,
                              lastWorkingDay: e.target.value,
                            })
                          }
                          className="border p-2 w-full"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={updateMember}
                            className="text-blue-600"
                          >
                            Save
                          </button>

                          <button
                            onClick={() => {
                              setEditingMemberId(null);
                              setEditMember({});
                            }}
                            className="text-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">{m.name}</td>

                      <td className="px-4 py-3">
                        {m.organization || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {m.location || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {m.managedBy || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {m.projectStartDate || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {m.lastWorkingDay || "—"}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            className="text-blue-600"
                            onClick={() => {
                              setEditingMemberId(m.id);
                              setEditMember(m);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="text-red-600"
                            onClick={() => deleteMember(m.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* LEAVE TYPES */}
      {activeTab === "leaveTypes" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-bold mb-4">Leave Types</h2>

          <div className="flex flex-wrap gap-2 mb-4">
            <label className="bg-gray-100 border px-4 py-2 rounded cursor-pointer">
              Import Leave Types from Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={importLeaveTypesFromExcel}
                className="hidden"
              />
            </label>
            <span className="text-sm text-gray-500 self-center">
              Uses the Leave Types sheet from the master-data template
            </span>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              value={newLeaveType}
              onChange={e => setNewLeaveType(e.target.value)}
              className="border p-2"
            />

            <button
              onClick={addLeaveType}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Add
            </button>
          </div>

          {leaveTypes.map(t => (
            <div
              key={t.id}
              className="border p-3 mb-2 flex justify-between"
            >
              {editingLeaveTypeId === t.id ? (
                <div className="flex gap-2 w-full">
                  <input
                    value={editLeaveTypeName}
                    onChange={e =>
                      setEditLeaveTypeName(e.target.value)
                    }
                    className="border p-2 flex-1"
                  />

                  <button
                    onClick={updateLeaveType}
                    className="text-blue-600"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => {
                      setEditingLeaveTypeId(null);
                      setEditLeaveTypeName("");
                    }}
                    className="text-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span>{t.name}</span>

                  <div className="flex gap-3">
                    <button
                      className="text-blue-600"
                      onClick={() => {
                        setEditingLeaveTypeId(t.id);
                        setEditLeaveTypeName(t.name);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="text-red-600"
                      onClick={() => deleteLeaveType(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* HOLIDAYS */}
      {activeTab === "holidays" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-bold mb-4">Company Holidays</h2>

          <div className="flex flex-wrap gap-2 mb-4">
            <label className="bg-gray-100 border px-4 py-2 rounded cursor-pointer">
              Import Company Holidays from Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={importCompanyHolidaysFromExcel}
                className="hidden"
              />
            </label>
            <span className="text-sm text-gray-500 self-center">
              Uses the Company Holidays sheet from the master-data template
            </span>
          </div>

          <div className="grid md:grid-cols-4 gap-2 mb-4">
            <input
              placeholder="Holiday Name"
              value={newHolidayName}
              onChange={e => setNewHolidayName(e.target.value)}
              className="border p-2"
            />

            <input
              type="date"
              value={newHolidayDate}
              onChange={e => setNewHolidayDate(e.target.value)}
              className="border p-2"
            />

            <input
              placeholder="Leave Organization"
              value={newHolidayOrg}
              onChange={e => setNewHolidayOrg(e.target.value)}
              className="border p-2"
            />

            <input
              placeholder="Work Location"
              value={newHolidayLocation}
              onChange={e => setNewHolidayLocation(e.target.value)}
              className="border p-2"
            />
          </div>

          <button
            onClick={addHoliday}
            className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
          >
            Add Holiday
          </button>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <select
              className="border p-2"
              value={selectedHolidayOrg}
              onChange={e => setSelectedHolidayOrg(e.target.value)}
            >
              <option>All Leave Organizations</option>

              {Array.from(
                new Set(
                  holidays
                    .map(h => h.organization)
                    .filter(Boolean)
                )
              )
                .sort()
                .map(org => (
                  <option key={org}>{org}</option>
                ))}
            </select>

            <select
              className="border p-2"
              value={selectedHolidayLocation}
              onChange={e =>
                setSelectedHolidayLocation(e.target.value)
              }
            >
              <option>All Locations</option>

              {Array.from(
                new Set(
                  holidays
                    .map(h => h.location)
                    .filter(Boolean)
                )
              )
                .sort()
                .map(location => (
                  <option key={location}>{location}</option>
                ))}
            </select>

            <button
              onClick={() => {
                setSelectedHolidayOrg(
                  "All Leave Organizations"
                );

                setSelectedHolidayLocation(
                  "All Locations"
                );
              }}
              className="ml-auto border px-4 py-2 rounded"
            >
              Clear Filter
            </button>
          </div>

          <table className="w-full border border-gray-200 rounded overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  Holiday Name
                </th>

                <th className="px-4 py-3 text-left">
                  Date
                </th>

                <th className="px-4 py-3 text-left">
                  Leave Organization
                </th>

                <th className="px-4 py-3 text-left">
                  Work Location
                </th>

                <th className="px-4 py-3 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {holidays
                .filter(h =>
                  (selectedHolidayOrg ===
                    "All Leave Organizations" ||
                    h.organization ===
                      selectedHolidayOrg) &&
                  (selectedHolidayLocation ===
                    "All Locations" ||
                    h.location ===
                      selectedHolidayLocation)
                )
                .map((h, idx) => (
                  <tr
                    key={h.id}
                    className={
                      idx % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    }
                  >
                    {editingHolidayId === h.id ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            value={editHoliday.name || ""}
                            onChange={e =>
                              setEditHoliday({
                                ...editHoliday,
                                name: e.target.value,
                              })
                            }
                            className="border p-2 w-full"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={editHoliday.date || ""}
                            onChange={e =>
                              setEditHoliday({
                                ...editHoliday,
                                date: e.target.value,
                              })
                            }
                            className="border p-2 w-full"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            value={
                              editHoliday.organization || ""
                            }
                            onChange={e =>
                              setEditHoliday({
                                ...editHoliday,
                                organization:
                                  e.target.value,
                              })
                            }
                            className="border p-2 w-full"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            value={editHoliday.location || ""}
                            onChange={e =>
                              setEditHoliday({
                                ...editHoliday,
                                location: e.target.value,
                              })
                            }
                            className="border p-2 w-full"
                          />
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={updateHoliday}
                              className="text-blue-600"
                            >
                              Save
                            </button>

                            <button
                              onClick={() => {
                                setEditingHolidayId(null);
                                setEditHoliday({});
                              }}
                              className="text-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          {h.name}
                        </td>

                        <td className="px-4 py-3">
                          {h.date}
                        </td>

                        <td className="px-4 py-3">
                          {h.organization || "—"}
                        </td>

                        <td className="px-4 py-3">
                          {h.location || "—"}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-3">
                            <button
                              className="text-blue-600"
                              onClick={() => {
                                setEditingHolidayId(h.id);
                                setEditHoliday(h);
                              }}
                            >
                              Edit
                            </button>

                            <button
                              className="text-red-600"
                              onClick={() =>
                                deleteHoliday(h.id)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    
          {/* CUSTOM HOLIDAYS */}
      {activeTab === "customHolidays" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-bold mb-4">
            Custom Holidays
          </h2>

          <div className="grid md:grid-cols-4 gap-2 mb-4">
            <select
              value={overrideMemberId}
              onChange={e =>
                setOverrideMemberId(e.target.value)
              }
              className="border p-2"
            >
              <option value="">
                Select Team Member
              </option>

              {members
                .sort((a, b) =>
                  a.name.localeCompare(b.name)
                )
                .map(m => (
                  <option
                    key={m.id}
                    value={m.id}
                  >
                    {m.name}
                  </option>
                ))}
            </select>

            <input
              placeholder="Holiday Name"
              value={overrideHolidayName}
              onChange={e =>
                setOverrideHolidayName(
                  e.target.value
                )
              }
              className="border p-2"
            />

            <input
              type="date"
              value={overrideHolidayDate}
              onChange={e =>
                setOverrideHolidayDate(
                  e.target.value
                )
              }
              className="border p-2"
            />

            <select
              value={overrideAction}
              onChange={e =>
                setOverrideAction(
                  e.target.value as
                    | "Add"
                    | "Remove"
                )
              }
              className="border p-2"
            >
              <option value="Add">
                Add Holiday
              </option>

              <option value="Remove">
                Remove Holiday
              </option>
            </select>
          </div>

          <button
            onClick={addOverride}
            className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
          >
            Add Custom Holiday
          </button>

          <table className="w-full border border-gray-200 rounded overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  Team Member
                </th>

                <th className="px-4 py-3 text-left">
                  Holiday Name
                </th>

                <th className="px-4 py-3 text-left">
                  Date
                </th>

                <th className="px-4 py-3 text-left">
                  Action
                </th>

                <th className="px-4 py-3 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {memberHolidayOverrides.map(
                (o, idx) => {
                  const member = members.find(
                    m => m.id === o.memberId
                  );

                  return (
                    <tr
                      key={o.id}
                      className={
                        idx % 2 === 0
                          ? "bg-white"
                          : "bg-gray-50"
                      }
                    >
                      {editingOverrideId ===
                      o.id ? (
                        <>
                          <td className="px-4 py-3">
                            <select
                              value={
                                editOverride.memberId ||
                                ""
                              }
                              onChange={e =>
                                setEditOverride({
                                  ...editOverride,
                                  memberId:
                                    e.target.value,
                                })
                              }
                              className="border p-2 w-full"
                            >
                              {members.map(m => (
                                <option
                                  key={m.id}
                                  value={m.id}
                                >
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={
                                editOverride.holidayName ||
                                ""
                              }
                              onChange={e =>
                                setEditOverride({
                                  ...editOverride,
                                  holidayName:
                                    e.target.value,
                                })
                              }
                              className="border p-2 w-full"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="date"
                              value={
                                editOverride.holidayDate ||
                                ""
                              }
                              onChange={e =>
                                setEditOverride({
                                  ...editOverride,
                                  holidayDate:
                                    e.target.value,
                                })
                              }
                              className="border p-2 w-full"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={
                                editOverride.action ||
                                "Add"
                              }
                              onChange={e =>
                                setEditOverride({
                                  ...editOverride,
                                  action:
                                    e.target
                                      .value as
                                      | "Add"
                                      | "Remove",
                                })
                              }
                              className="border p-2 w-full"
                            >
                              <option value="Add">
                                Add
                              </option>

                              <option value="Remove">
                                Remove
                              </option>
                            </select>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={
                                  updateOverride
                                }
                                className="text-blue-600"
                              >
                                Save
                              </button>

                              <button
                                onClick={() => {
                                  setEditingOverrideId(
                                    null
                                  );

                                  setEditOverride(
                                    {}
                                  );
                                }}
                                className="text-gray-500"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            {member?.name || "—"}
                          </td>

                          <td className="px-4 py-3">
                            {o.holidayName}
                          </td>

                          <td className="px-4 py-3">
                            {o.holidayDate}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                o.action ===
                                "Add"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {o.action}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-3">
                              <button
                                className="text-blue-600"
                                onClick={() => {
                                  setEditingOverrideId(
                                    o.id
                                  );

                                  setEditOverride(
                                    o
                                  );
                                }}
                              >
                                Edit
                              </button>

                              <button
                                className="text-red-600"
                                onClick={() =>
                                  deleteOverride(
                                    o.id
                                  )
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
