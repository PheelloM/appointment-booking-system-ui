import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Branch } from '../models/branch.interface';
import { TimeSlot } from '../models/time-slot.interface';
import { AppointmentRequest } from '../models/appointment-request.interface';
import { AppointmentResponse } from '../models/appointment-response.interface';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Branch endpoints
  getAllBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(`${this.apiUrl}/branches`);
  }

  // Time slot endpoints
  getAvailableTimeSlots(branchId: string, date: string): Observable<TimeSlot[]> {
    const params = new HttpParams()
      .set('branchId', branchId)
      .set('date', date);

    return this.http.get<TimeSlot[]>(`${this.apiUrl}/timeslots/available`, { params });
  }

  // Appointment endpoints - THESE REQUIRE AUTHENTICATION
  createAppointment(appointmentRequest: AppointmentRequest): Observable<AppointmentResponse> {
    // Transform the request to match backend DTO exactly
    const backendRequest = {
      branchId: appointmentRequest.branchId,
      customerName: appointmentRequest.customerName,
      customerEmail: appointmentRequest.customerEmail,
      customerPhone: appointmentRequest.customerPhone,
      appointmentDate: appointmentRequest.appointmentDate,
      startTime: appointmentRequest.startTime
    };

    console.log('Sending appointment request to backend:', backendRequest);
    return this.http.post<AppointmentResponse>(`${this.apiUrl}/appointments`, backendRequest);
  }

  getMyAppointments(): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${this.apiUrl}/appointments/my-appointments`);
  }

  getAppointmentByReference(referenceNumber: string): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${this.apiUrl}/appointments/${referenceNumber}`);
  }

  cancelAppointment(referenceNumber: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/appointments/${referenceNumber}`);
  }

  // Utility methods
  validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    return phoneRegex.test(phone);
  }

  formatDateForDisplay(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTimeForDisplay(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}