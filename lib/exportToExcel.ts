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

  const rows = leaves.map(l => [
    l.memberName,
    l.leaveType,
    l.status,
    l.ptoDays,
    l.startDate,
    l.endDate,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.join(",")),
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
}
