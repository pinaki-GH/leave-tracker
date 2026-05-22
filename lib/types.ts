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

  // Existing fields already being used in app
  organization?: string;
  location?: string;
  managedBy?: string;
};

export type LeaveType = {
  id: string;
  name: string;
};

// NEW: Member-specific holiday overrides
export type MemberHolidayOverrideAction =
  | "Add"
  | "Remove";

export type MemberHolidayOverride = {
  id: string;

  // Use stable member ID internally
  memberId: string;

  holidayName: string;

  holidayDate: string;

  action: MemberHolidayOverrideAction;
};
