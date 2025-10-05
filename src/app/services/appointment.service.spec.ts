import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppointmentService } from './appointment.service';
import { environment } from '../../environments/environment';
import { Branch, TimeSlot, AppointmentRequest, AppointmentResponse } from '../models';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AppointmentService]
    });
    service = TestBed.inject(AppointmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllBranches', () => {
    it('should return all branches', () => {
      const mockBranches: Branch[] = [
        { id: '1', name: 'Branch 1', address: 'Address 1', timezone: 'EST' },
        { id: '2', name: 'Branch 2', address: 'Address 2', timezone: 'PST' }
      ];

      service.getAllBranches().subscribe(branches => {
        expect(branches).toEqual(mockBranches);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/branches`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBranches);
    });
  });

  describe('createAppointment', () => {
    it('should create an appointment', () => {
      const appointmentRequest: AppointmentRequest = {
        branchId: 1,
        appointmentDate: '2024-01-01',
        startTime: '10:00',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+1234567890'
      };

      const mockResponse: AppointmentResponse = {
        id:  1,
    customerName:  "John Doe",
    customerEmail:  "john@example.com",
    customerPhone:  "1234567890",
    bookingReference:  "APT-20251003-42BCAE",
    status:  "CONFIRMED",
    appointmentDate:  "2025-10-04",
    startTime:  "09:30:00",
    endTime:  "10:00:00",
    branchName:  "Downtown Branch",
    branchAddress:  "123 Main St, Downtown"

      };

      service.createAppointment(appointmentRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/appointments`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(appointmentRequest);
      req.flush(mockResponse);
    });
  });

  describe('validation methods', () => {
    it('should validate email correctly', () => {
      expect(service.validateEmail('test@example.com')).toBeTrue();
      expect(service.validateEmail('invalid-email')).toBeFalse();
    });

    it('should validate phone correctly', () => {
      expect(service.validatePhone('+1234567890')).toBeTrue();
      expect(service.validatePhone('1234567890')).toBeTrue();
      expect(service.validatePhone('123')).toBeFalse();
    });
  });
});
