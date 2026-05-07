"use client";

import { useEffect, useState } from "react";
import { getData, saveData } from "@/lib/storage";

/* ================= TYPES ================= */

type Member = {
  id: string;
  name: string;
  organization: string;
  location: string;
  managedBy: string;
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

/* ================= COMPONENT ================= */

export default function MembersPage() {
  const [activeTab, setActiveTab] = useState<
    "members" | "leaveTypes" | "holidays"
  >("members");

  const [members, setMembers] = useState<Member[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [newName, setNewName] = useState("");
  const [newOrg, setNewOrg] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newManagedBy, setNewManagedBy] = useState("");

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

  useEffect(() => {
    const storedMembers = (getData("members") as Partial<Member>[]) || [];

    setMembers(
      storedMembers.map(m => ({
        id: m.id!,
        name: m.name!,
        organization: m.organization || "",
        location: m.location || "",
        managedBy: m.managedBy || "",
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
      },
    ]);

    setNewName("");
    setNewOrg("");
    setNewLocation("");
    setNewManagedBy("");
  };

  const updateMember = () => {
    if (!editingMemberId || !editMember.name?.trim()) return;

    saveMembers(
      <table className="w-full border border-gray-200 rounded overflow-hidden">
  <thead className="bg-gray-100">
    <tr>
      <th className="px-4 py-3 text-left">Team Member</th>
      <th className="px-4 py-3 text-left">Leave Organization</th>
      <th className="px-4 py-3 text-left">Work Location</th>
      <th className="px-4 py-3 text-left">Managed By</th>
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

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b pb-2">
        {["members", "leaveTypes", "holidays"].map(tab => (
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

          <div className="grid md:grid-cols-4 gap-2 mb-4">
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
          </div>

          <button
            onClick={addMember}
            className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
          >
            Add Member
          </button>

          {members.map(m => (
            <div
              key={m.id}
              className="border p-3 mb-2 flex justify-between items-start"
            >
              {editingMemberId === m.id ? (
                <div className="grid md:grid-cols-4 gap-2 w-full">
                  <input
                    value={editMember.name || ""}
                    onChange={e =>
                      setEditMember({
                        ...editMember,
                        name: e.target.value,
                      })
                    }
                    className="border p-2"
                  />

                  <input
                    value={editMember.organization || ""}
                    onChange={e =>
                      setEditMember({
                        ...editMember,
                        organization: e.target.value,
                      })
                    }
                    className="border p-2"
                  />

                  <select
                    value={editMember.location || ""}
                    onChange={e =>
                      setEditMember({
                        ...editMember,
                        location: e.target.value,
                      })
                    }
                    className="border p-2"
                  >
                    <option value="">Select Location</option>

                    {locations.map(l => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>

                  <input
                    value={editMember.managedBy || ""}
                    onChange={e =>
                      setEditMember({
                        ...editMember,
                        managedBy: e.target.value,
                      })
                    }
                    className="border p-2"
                  />

                  <div className="col-span-full flex gap-3 mt-2">
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
                </div>
              ) : (
                <>
                  <div>
                    <div>
                      {m.name} ({m.organization}) - {m.location}
                    </div>

                    {m.managedBy && (
                      <div className="text-sm text-gray-500">
                        Managed By: {m.managedBy}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
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
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* LEAVE TYPES */}
      {activeTab === "leaveTypes" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-bold mb-4">Leave Types</h2>

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
              placeholder="Organization"
              value={newHolidayOrg}
              onChange={e => setNewHolidayOrg(e.target.value)}
              className="border p-2"
            />

            <input
              placeholder="Location"
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

          {holidays.map(h => (
            <div
              key={h.id}
              className="border p-3 mb-2 flex justify-between items-start"
            >
              {editingHolidayId === h.id ? (
                <div className="grid md:grid-cols-4 gap-2 w-full">
                  <input
                    value={editHoliday.name || ""}
                    onChange={e =>
                      setEditHoliday({
                        ...editHoliday,
                        name: e.target.value,
                      })
                    }
                    className="border p-2"
                  />

                  <input
                    type="date"
                    value={editHoliday.date || ""}
                    onChange={e =>
                      setEditHoliday({
                        ...editHoliday,
                        date: e.target.value,
                      })
                    }
                    className="border p-2"
                  />

                  <input
                    value={editHoliday.organization || ""}
                    onChange={e =>
                      setEditHoliday({
                        ...editHoliday,
                        organization: e.target.value,
                      })
                    }
                    className="border p-2"
                  />

                  <input
                    value={editHoliday.location || ""}
                    onChange={e =>
                      setEditHoliday({
                        ...editHoliday,
                        location: e.target.value,
                      })
                    }
                    className="border p-2"
                  />

                  <div className="col-span-full flex gap-3 mt-2">
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
                </div>
              ) : (
                <>
                  <div>
                    {h.name} - {h.organization} - {h.location} (
                    {h.date})
                  </div>

                  <div className="flex gap-3">
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
                      onClick={() => deleteHoliday(h.id)}
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
    </div>
  );
}
