export type Leave = {
  id: string;
  memberName: string;
  leaveType: string;
  ptoDays: number;
  startDate: string;
  endDate: string;
};

export type Member = {
  id: string;
  name: string;
};

export type LeaveType = {
  id: string;
  name: string;
};
