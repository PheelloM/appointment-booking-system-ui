import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { AppointmentResponse } from '../../models';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-appointment-details',
  templateUrl: './appointment-details.component.html',
  styleUrls: ['./appointment-details.component.css']
})
export class AppointmentDetailsComponent implements OnInit {
  appointment: AppointmentResponse | null = null;
  loading = false;
  error = '';
  referenceNumber: string = '';
  canceling = false; // Add separate flag for cancellation

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.referenceNumber = params.get('referenceNumber') || '';
      if (this.referenceNumber) {
        this.loadAppointmentDetails();
      } else {
        this.error = 'No appointment reference provided';
      }
    });
  }

  loadAppointmentDetails(): void {
    this.loading = true;
    this.error = '';

    this.appointmentService.getAppointmentByReference(this.referenceNumber).subscribe({
      next: (appointment) => {
        this.appointment = appointment;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading appointment details:', error);
        this.error = 'Failed to load appointment details. Please try again.';
        this.loading = false;
        this.messageService.showError(this.error);
      }
    });
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

  cancelAppointment(): void {
    if (!this.appointment) return;

    const confirmed = confirm(`Are you sure you want to cancel your appointment at ${this.appointment.branchName} on ${this.formatDate(this.appointment.appointmentDate)}?`);
    
    if (confirmed) {
      this.canceling = true; // Use separate flag for cancellation

      this.appointmentService.cancelAppointment(this.referenceNumber).subscribe({
        next: () => {
          this.messageService.showSuccess('Appointment cancelled successfully');
          // Use setTimeout to ensure UI updates properly
          setTimeout(() => {
            this.loadAppointmentDetails(); // Reload to get updated status
            this.canceling = false;
          }, 500);
        },
        error: (error) => {
          console.error('Error cancelling appointment:', error);
          let errorMessage = 'Failed to cancel appointment. Please try again.';
          
          // Handle specific error cases
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 400) {
            errorMessage = 'Cannot cancel this appointment. It may be already cancelled or in the past.';
          }
          
          this.messageService.showError(errorMessage);
          this.canceling = false;
        }
      });
    }
  }

  rescheduleAppointment(): void {
    if (!this.appointment) return;

    this.router.navigate(['/appointments'], {
      state: { 
        reschedule: true,
        appointment: this.appointment 
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/my-appointments']);
  }

  canCancel(): boolean {
    if (!this.appointment) return false;
    
    const status = this.appointment.status?.toLowerCase();
    const appointmentDate = new Date(this.appointment.appointmentDate);
    const today = new Date();
    
    // Clear time part for date comparison only
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    
    // Can only cancel confirmed/pending appointments that are today or in the future
    return (status === 'confirmed' || status === 'pending') && appointmentDate >= today;
  }

  canReschedule(): boolean {
    if (!this.appointment) return false;
    
    const status = this.appointment.status?.toLowerCase();
    const appointmentDate = new Date(this.appointment.appointmentDate);
    const today = new Date();
    
    // Clear time part for date comparison only
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    
    // Can only reschedule confirmed appointments that are today or in the future
    return status === 'confirmed' && appointmentDate >= today;
  }
}