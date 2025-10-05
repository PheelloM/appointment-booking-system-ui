import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { AppointmentFormComponent } from './appointment-form.component';
import { AppointmentService } from '../../services/appointment.service';
import { Branch } from 'src/app/models/branch.interface';


describe('AppointmentFormComponent', () => {
  let component: AppointmentFormComponent;
  let fixture: ComponentFixture<AppointmentFormComponent>;
  let appointmentService: jasmine.SpyObj<AppointmentService>;

  const mockBranches: Branch[] = [
    { id: '1', name: 'Downtown', address: '123 Main St', timezone: 'EST' },
    { id: '2', name: 'Uptown', address: '456 Oak Ave', timezone: 'PST' }
  ];

  beforeEach(async () => {
    const appointmentServiceSpy = jasmine.createSpyObj('AppointmentService', [
      'getAllBranches',
      'getAvailableTimeSlots',
      'createAppointment'
    ]);

    await TestBed.configureTestingModule({
      declarations: [AppointmentFormComponent],
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: AppointmentService, useValue: appointmentServiceSpy }
      ]
    }).compileComponents();

    appointmentService = TestBed.inject(AppointmentService) as jasmine.SpyObj<AppointmentService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppointmentFormComponent);
    component = fixture.componentInstance;
    appointmentService.getAllBranches.and.returnValue(of(mockBranches));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load branches on init', () => {
    expect(appointmentService.getAllBranches).toHaveBeenCalled();
    expect(component.branches).toEqual(mockBranches);
  });

  it('should initialize form with required fields', () => {
    expect(component.appointmentForm).toBeDefined();
    expect(component.appointmentForm.get('branchId')).toBeTruthy();
    expect(component.appointmentForm.get('date')).toBeTruthy();
    expect(component.appointmentForm.get('time')).toBeTruthy();
    expect(component.appointmentForm.get('customerName')).toBeTruthy();
    expect(component.appointmentForm.get('customerEmail')).toBeTruthy();
    expect(component.appointmentForm.get('customerPhone')).toBeTruthy();
  });

  it('should validate required fields', () => {
    const form = component.appointmentForm;
    expect(form.valid).toBeFalse();

    form.patchValue({
      branchId: '1',
      date: '2024-01-01',
      time: '10:00',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+1234567890'
    });

    expect(form.valid).toBeTrue();
  });

  it('should show error when form is invalid on submit', () => {
    component.onSubmit();
    expect(component.error).toBe('Please fill in all required fields correctly.');
  });

  it('should handle branch loading error', () => {
    appointmentService.getAllBranches.and.returnValue(throwError(() => new Error('Network error')));
    component.ngOnInit();
    expect(component.error).toBe('Failed to load branches. Please try again later.');
  });
});
