export interface AppointmentResponse {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingReference: string;
  status: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  branchName: string;
  branchAddress: string;
}