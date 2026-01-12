"use client";

import { useEffect, useState } from "react";
import { getData, saveData } from "@/lib/storage";

type Item = {
  id: string;
  name: string;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Item[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<Item[]>([]);

  const [newMember, setNewMember] = useState("");
  const [newLeaveType, setNewLeaveType] = useState("");

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingLeaveTypeId, setEditingLeaveTypeId] = useState<string | null>(null);

  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    setMembers(getData<Item[]>("members") || []);
    setLeaveTypes(getData<Item[]>("leaveTypes") || []);
  }, []);

  /* ---------- Helpers ---------- */

  const saveMembers = (data: Item[]) => {
    setMembers(data);
    saveData("members", data);
  };

  const saveLeaveTypes = (data: Item[]) => {
    setLeaveTypes(data);
    saveData("leaveTypes", data);
  };

  /* ---------- Members ---------- */

  const addMember = () => {
    if (!newMember.trim()) return;

    saveMembers([
      ...members,
      { id: crypto.randomUUID(), name: newMember.trim() },
    ]);

    setNewMember("");
  };

  const updateMember = () => {
    if (!editValue.trim() || !editingMemberId) return;

    saveMembers(
      members.map(m =>
        m.id === editingMemberId ? { ...m, name: editValue.trim() } : m
      )
    );

    setEditingMemberId(null);
    setEditValue("");
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
    if (!editValue.trim() || !editingLeaveTypeId) return;

    saveLeaveTypes(
      leaveTypes.map(t =>
        t.id === editingLeaveTypeId ? { ...t, name: editValue.trim() } : t
      )
    );

    setEditingLeaveTypeId(null);
    setEditValue("");
  };

  const deleteLeaveType = (id: string) => {
    saveLeaveTypes(leaveTypes.filter(t => t.id !== id));
  };

  /* ---------- UI ---------- */

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Members */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-4">Team Members</h2>

        <div className="flex gap-2 mb-4">
          <input
            className="border px-3 py-2 rounded text-sm flex-1"
            placeholder="Add new member"
            value={newMember}
            onChange={e => setNewMember(e.target.value)}
          />
          <button
            onClick={addMember}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            Add
          </button>
        </div>

        <ul className="space-y-2">
          {members.map(m => (
            <li
              key={m.id}
              className="flex items-center gap-2 border p-2 rounded"
            >
              {editingMemberId === m.id ? (
                <>
                  <input
                    className="border px-2 py-1 rounded text-sm flex-1"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                  />
                  <button
                    onClick={updateMember}
                    className="text-blue-600 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingMemberId(null);
                      setEditValue("");
                    }}
                    className="text-gray-500 text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1">{m.name}</span>
                  <button
                    onClick={() => {
                      setEditingMemberId(m.id);
                      setEditValue(m.name);
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
                </>
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
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
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
                      setEditValue("");
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
                      setEditValue(t.name);
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
