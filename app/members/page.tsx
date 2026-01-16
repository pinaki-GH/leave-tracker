"use client";

import { useEffect, useState } from "react";
import { getData, saveData } from "@/lib/storage";

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

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);

  /* ---------- Add Member ---------- */
  const [newName, setNewName] = useState("");
  const [newOrg, setNewOrg] = useState("");
  const [newLocation, setNewLocation] = useState("");

  /* ---------- Edit ---------- */
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingLeaveTypeId, setEditingLeaveTypeId] = useState<string | null>(null);

  const [editMember, setEditMember] = useState<Partial<Member>>({});
  const [editLeaveTypeName, setEditLeaveTypeName] = useState("");

  /* ---------- Add Leave Type ---------- */
  const [newLeaveType, setNewLeaveType] = useState("");

  useEffect(() => {
    setMembers((getData("members") as Member[]) || []);
    setLeaveTypes((getData("leaveTypes") as LeaveType[]) || []);
  }, []);

  /* ---------- Helpers ---------- */

  const saveMembers = (data: Member[]) => {
    setMembers(data);
    saveData("members", data);
  };

  const saveLeaveTypes = (data: LeaveType[]) => {
    setLeaveTypes(data);
    saveData("leaveTypes", data);
  };

  /* ---------- Members ---------- */

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
              name: editMember.name!.trim(),
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

  /* ---------- Leave Types ---------- */

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

  /* ---------- UI ---------- */

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Team Members */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-4">Team Members</h2>

        {/* Add Member */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="Member Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="Organization"
            value={newOrg}
            onChange={e => setNewOrg(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="Location"
            value={newLocation}
            onChange={e => setNewLocation(e.target.value)}
          />
        </div>

        <button
          onClick={addMember}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm mb-4"
        >
          Add Member
        </button>

        {/* Member List */}
        <ul className="space-y-2">
          {members.map(m => (
            <li
              key={m.id}
              className="border rounded p-3"
            >
              {editingMemberId === m.id ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    className="border px-2 py-1 rounded text-sm"
                    value={editMember.name || ""}
                    onChange={e =>
                      setEditMember({ ...editMember, name: e.target.value })
                    }
                  />
                  <input
                    className="border px-2 py-1 rounded text-sm"
                    value={editMember.organization || ""}
                    onChange={e =>
                      setEditMember({
                        ...editMember,
                        organization: e.target.value,
                      })
                    }
                  />
                  <input
                    className="border px-2 py-1 rounded text-sm"
                    value={editMember.location || ""}
                    onChange={e =>
                      setEditMember({
                        ...editMember,
                        location: e.target.value,
                      })
                    }
                  />

                  <div className="col-span-full flex gap-2 mt-2">
                    <button
                      onClick={updateMember}
                      className="text-blue-600 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingMemberId(null);
                        setEditMember({});
                      }}
                      className="text-gray-500 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-sm text-gray-600">
                      {m.organization || "—"} · {m.location || "—"}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingMemberId(m.id);
                      setEditMember(m);
                    }}
                    className="text-blue-600 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMember(m.id)}
                    className="text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Leave Types */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-4">Leave Types</h2>

        <div className="flex gap-2 mb-4">
          <input
            className="border px-3 py-2 rounded text-sm flex-1"
            placeholder="Add new leave type"
            value={newLeaveType}
            onChange={e => setNewLeaveType(e.target.value)}
          />
          <button
            onClick={addLeaveType}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            Add
          </button>
        </div>

        <ul className="space-y-2">
          {leaveTypes.map(t => (
            <li
              key={t.id}
              className="flex items-center gap-2 border p-2 rounded"
            >
              {editingLeaveTypeId === t.id ? (
                <>
                  <input
                    className="border px-2 py-1 rounded text-sm flex-1"
                    value={editLeaveTypeName}
                    onChange={e => setEditLeaveTypeName(e.target.value)}
                  />
                  <button
                    onClick={updateLeaveType}
                    className="text-blue-600 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingLeaveTypeId(null);
                      setEditLeaveTypeName("");
                    }}
                    className="text-gray-500 text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1">{t.name}</span>
                  <button
                    onClick={() => {
                      setEditingLeaveTypeId(t.id);
                      setEditLeaveTypeName(t.name);
                    }}
                    className="text-blue-600 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteLeaveType(t.id)}
                    className="text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
