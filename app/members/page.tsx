"use client";

import { useEffect, useState } from "react";
import { getData, saveData } from "@/lib/storage";

/* ================= TYPES ================= */

type Member = {
  id: string;
  name: string;
  organization: string;
  location: string;
};

type LeaveType = {
  id: string;
  name: string;
};

type Holiday = {
  id: string;
  organization: string; // ✅ NEW
  location: string;
  date: string;
  name: string;
};

/* ================= COMPONENT ================= */

export default function MembersPage() {
  const [activeTab, setActiveTab] = useState<"members" | "leaveTypes" | "holidays">("members");

  const [members, setMembers] = useState<Member[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  /* ---------- Member Inputs ---------- */
  const [newName, setNewName] = useState("");
  const [newOrg, setNewOrg] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMember, setEditMember] = useState<Partial<Member>>({});

  /* ---------- Leave Types ---------- */
  const [newLeaveType, setNewLeaveType] = useState("");
  const [editingLeaveTypeId, setEditingLeaveTypeId] = useState<string | null>(null);
  const [editLeaveTypeName, setEditLeaveTypeName] = useState("");

  /* ---------- Holidays ---------- */
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayLocation, setNewHolidayLocation] = useState("");
  const [newHolidayOrg, setNewHolidayOrg] = useState(""); // ✅ NEW

  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [editHoliday, setEditHoliday] = useState<Partial<Holiday>>({});

  /* ---------- Load Data ---------- */

  useEffect(() => {
    const storedMembers = (getData("members") as Partial<Member>[]) || [];
    setMembers(
      storedMembers.map(m => ({
        id: m.id!,
        name: m.name!,
        organization: m.organization || "",
        location: m.location || "",
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
  }, []);

  /* ---------- Save Helpers ---------- */

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

  /* ---------- Derived Locations ---------- */

  const locations = Array.from(
    new Set([
      ...members.map(m => m.location),
      ...holidays.map(h => h.location),
    ])
  ).filter(Boolean).sort();

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
      },
    ]);

    setNewName("");
    setNewOrg("");
    setNewLocation("");
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
    if (!newHolidayName || !newHolidayDate || !newHolidayLocation || !newHolidayOrg) return;

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

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b pb-2">
        {["members","leaveTypes","holidays"].map(tab => (
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
          </button>
        ))}
      </div>

      {/* MEMBERS */}
      {activeTab === "members" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-bold mb-4">Team Members</h2>

          <div className="grid md:grid-cols-3 gap-2 mb-4">
            <input placeholder="Name" value={newName} onChange={e=>setNewName(e.target.value)} className="border p-2"/>
            <input placeholder="Organization" value={newOrg} onChange={e=>setNewOrg(e.target.value)} className="border p-2"/>
            <input placeholder="Location" value={newLocation} onChange={e=>setNewLocation(e.target.value)} className="border p-2"/>
          </div>

          <button onClick={addMember}>Add Member</button>

          {members.map(m => <div key={m.id}>{m.name}</div>)}
        </div>
      )}

      {/* LEAVE TYPES */}
      {activeTab === "leaveTypes" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-bold mb-4">Leave Types</h2>

          <input value={newLeaveType} onChange={e=>setNewLeaveType(e.target.value)} />
          <button onClick={addLeaveType}>Add</button>

          {leaveTypes.map(t => <div key={t.id}>{t.name}</div>)}
        </div>
      )}

      {/* HOLIDAYS */}
      {activeTab === "holidays" && (
        <div className="bg-white p-6 rounded shadow">
          {/* (already correct) */}
        </div>
      )}
    </div>
  );
}
