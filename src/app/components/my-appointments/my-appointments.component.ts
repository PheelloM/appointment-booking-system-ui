import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentResponse } from 'src/app/models';
import { AppointmentService } from 'src/app/services/appointment.service';
import { AuthService } from 'src/app/services/auth.service';
import { MessageService } from 'src/app/services/message.service';

@Component({
  selector: 'app-my-appointments',
  templateUrl: './my-appointments.component.html',
  styleUrls: ['./my-appointments.component.css']
})
export class MyAppointmentsComponent implements OnInit {
  appointments: AppointmentResponse[] = [];
  loading = false;
  error = '';
  cancelingReferences: Set<string> = new Set(); // Track which appointments are being cancelled

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyAppointments();
  }

  loadMyAppointments(): void {
    this.loading = true;
    this.error = '';
    
    this.appointmentService.getMyAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.error = 'Failed to load your appointments. Please try again.';
        this.loading = false;
        this.messageService.showError(this.error);
      }
    });
  }

  cancelAppointment(referenceNumber: string): void {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.cancelingReferences.add(referenceNumber); // Add to canceling set

      this.appointmentService.cancelAppointment(referenceNumber).subscribe({
        next: () => {
          this.messageService.showSuccess('Appointment cancelled successfully');
          // Use setTimeout to ensure UI updates properly
          setTimeout(() => {
            this.loadMyAppointments(); // Reload the list
            this.cancelingReferences.delete(referenceNumber); // Remove from canceling set
          }, 500);
        },
        error: (error) => {
          console.error('Error canceling appointment:', error);
          let errorMessage = 'Failed to cancel appointment. Please try again.';
          
          // Handle specific error cases
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 400) {
            errorMessage = 'Cannot cancel this appointment. It may be already cancelled or in the past.';
          }
          
          this.messageService.showError(errorMessage);
          this.cancelingReferences.delete(referenceNumber); // Remove from canceling set
        }
      });
    }
  }

  isCanceling(referenceNumber: string): boolean {
    return this.cancelingReferences.has(referenceNumber);
  }

  rescheduleAppointment(appointment: AppointmentResponse): void {
    // Navigate to booking page with pre-filled data
    this.router.navigate(['/appointments'], {
      state: { 
        reschedule: true,
        appointment: appointment 
      }
    });
  }

  viewAppointmentDetails(referenceNumber: string): void {
    this.router.navigate(['/appointment-details', referenceNumber]);
  }

  formatDate(date: string): string {
    return this.appointmentService.formatDateForDisplay(date);
  }

  formatTime(time: string): string {
    return this.appointmentService.formatTimeForDisplay(time);
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-unknown';
    }
  }

  canCancel(appointment: AppointmentResponse): boolean {
    const status = appointment.status?.toLowerCase();
    const appointmentDate = new Date(appointment.appointmentDate);
    const today = new Date();
    
    // Clear time part for date comparison only
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    
    // Can only cancel confirmed/pending appointments that are today or in the future
    return (status === 'confirmed' || status === 'pending') && appointmentDate >= today;
  }

  canReschedule(appointment: AppointmentResponse): boolean {
    const status = appointment.status?.toLowerCase();
    const appointmentDate = new Date(appointment.appointmentDate);
    const today = new Date();
    
    // Clear time part for date comparison only
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    
    // Can only reschedule confirmed appointments that are today or in the future
    return status === 'confirmed' && appointmentDate >= today;
  }

  bookNewAppointment(): void {
    this.router.navigate(['/appointments']);
  }
}