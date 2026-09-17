import { Leave } from "./types";

export function exportLeavesToExcel(leaves: Leave[]) {
  if (!leaves.length) return;

  const headers = [
    "Member Name",
    "Leave Type",
    "Status",
    "PTO Days",
    "Start Date",
    "End Date",
  ];

  // Keep all records together by member, then sort chronologically.
  // This allows Personal Leave and Company Holiday records to appear
  // together for each member in the exported file.
  const sortedLeaves = [...leaves].sort((a, b) => {
    const memberCompare = a.memberName.localeCompare(b.memberName);

    if (memberCompare !== 0) {
      return memberCompare;
    }

    const dateCompare = a.startDate.localeCompare(b.startDate);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const endDateCompare = a.endDate.localeCompare(b.endDate);

    if (endDateCompare !== 0) {
      return endDateCompare;
    }

    return a.leaveType.localeCompare(b.leaveType);
  });

  const escapeCsvValue = (value: unknown) => {
    const text = String(value ?? "");

    if (
      text.includes(",") ||
      text.includes('"') ||
      text.includes("\n") ||
      text.includes("\r")
    ) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const rows = sortedLeaves.map(l => [
    l.memberName,
    l.leaveType,
    l.status,
    l.ptoDays,
    l.startDate,
    l.endDate,
  ]);

  const csvContent = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map(row => row.map(escapeCsvValue).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute(
    "download",
    `leave-export-${new Date().toISOString().slice(0, 10)}.csv`
  );

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
