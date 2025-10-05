export interface TimeSlot {
  id: number;
  branchId: number;
  branchName: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  available: boolean;
}