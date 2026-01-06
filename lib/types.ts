export type LeaveStatus = "Planned" | "Confirmed";

export type Leave = {
  id: string;
  memberName: string;
  leaveType: string;
  ptoDays: number;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
};

export type Member = {
  id: string;
  name: string;
};

export type LeaveType = {
  id: string;
  name: string;
};
