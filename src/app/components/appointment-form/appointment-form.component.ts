import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppointmentService } from '../../services/appointment.service';
import { Branch, TimeSlot } from 'src/app/models';
import { AppointmentRequest } from 'src/app/models/appointment-request.interface';
import { AuthService } from 'src/app/services/auth.service'; // Add this import

@Component({
  selector: 'app-appointment-form',
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.css']
})
export class AppointmentFormComponent implements OnInit, OnDestroy {
  appointmentForm!: FormGroup;
  branches: Branch[] = [];
  availableSlots: TimeSlot[] = [];
  loading = false;
  loadingSlots = false;
  error = '';
  success = '';

  minDate: string;
  maxDate: string;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public appointmentService: AppointmentService,
    private router: Router,
    private authService: AuthService // Inject AuthService
  ) {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 90);
    this.maxDate = maxDate.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadBranches();
    this.setupFormListeners();
    this.populateUserInfo(); // Add this method call
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.appointmentForm = this.fb.group({
      branchId: ['', [Validators.required]],
      appointmentDate: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      customerName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      customerEmail: ['', [Validators.required, Validators.email]],
      customerPhone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-()]{10,}$/)]]
    });
  }

  private populateUserInfo(): void {
    // Get user profile from AuthService
    const userProfile = this.authService.getUserProfile();
    
    if (userProfile && userProfile.username) {
      // Populate the customerName field with username and make it readonly
      this.appointmentForm.patchValue({
        customerName: userProfile.username
      });
      
      // If you also want to populate email from user profile (optional)
      if (userProfile.email) {
        this.appointmentForm.patchValue({
          customerEmail: userProfile.email
        });
      }
    }
  }

  private setupFormListeners(): void {
    this.appointmentForm.get('branchId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onBranchOrDateChange());

    this.appointmentForm.get('appointmentDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onBranchOrDateChange());
  }

  private loadBranches(): void {
    this.loading = true;
    this.appointmentService.getAllBranches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (branches) => {
          this.branches = branches;
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load branches:', error);
          this.error = 'Failed to load branches. Please try again later.';
          this.loading = false;
        }
      });
  }

  private onBranchOrDateChange(): void {
    const branchId = this.appointmentForm.get('branchId')?.value;
    const appointmentDate = this.appointmentForm.get('appointmentDate')?.value;

    if (branchId && appointmentDate) {
      this.loadingSlots = true;
      this.availableSlots = [];
      this.appointmentForm.get('startTime')?.setValue('');

      this.appointmentService.getAvailableTimeSlots(branchId, appointmentDate)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (slots) => {
            this.availableSlots = slots.filter(slot => slot.available);
            this.loadingSlots = false;
          },
          error: (error) => {
            console.error('Failed to load available slots:', error);
            this.availableSlots = [];
            this.loadingSlots = false;
          }
        });
    } else {
      this.availableSlots = [];
    }
  }

  onSubmit(): void {
    if (this.appointmentForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = '';

      // Get form values and convert branchId to number
      const formValues = this.appointmentForm.value;
      
      // Create request object matching the backend DTO
      const appointmentRequest: AppointmentRequest = {
        branchId: parseInt(formValues.branchId),
        customerName: formValues.customerName,
        customerEmail: formValues.customerEmail,
        customerPhone: formValues.customerPhone,
        appointmentDate: formValues.appointmentDate,
        startTime: formValues.startTime
      };

      console.log('Submitting appointment request:', appointmentRequest);

      this.appointmentService.createAppointment(appointmentRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (appointment) => {
            this.loading = false;
            this.success = 'Appointment booked successfully!';
            console.log('Appointment created successfully:', appointment);

            setTimeout(() => {
              this.router.navigate(['/confirmation', appointment.bookingReference]);
            }, 2000);
          },
          error: (error) => {
            this.loading = false;
            this.error = error.error?.message || 'Failed to create appointment. Please try again.';
            console.error('Appointment creation error:', error);
            
            // If it's an authentication error, redirect to login
            if (error.status === 401 || error.status === 403) {
              this.router.navigate(['/login'], { 
                queryParams: { returnUrl: this.router.url } 
              });
            }
          }
        });
    } else {
      this.markFormGroupTouched();
      this.error = 'Please fill in all required fields correctly.';
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.appointmentForm.controls).forEach(key => {
      const control = this.appointmentForm.get(key);
      control?.markAsTouched();
    });
  }

  getSelectedBranch(): Branch | undefined {
    return this.branches.find(b => b.id === this.appointmentForm.get('branchId')?.value);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.appointmentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.appointmentForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return 'This field is required';
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `Minimum length is ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `Maximum length is ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid phone number';
      }
    }
    return '';
  }
}