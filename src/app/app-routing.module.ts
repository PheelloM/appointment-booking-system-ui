import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentFormComponent } from './components/appointment-form/appointment-form.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { MyAppointmentsComponent } from './components/my-appointments/my-appointments.component';
import { AppointmentDetailsComponent } from './components/appointment-details/appointment-details.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'appointments', component: AppointmentFormComponent, canActivate: [AuthGuard] },
  { path: 'my-appointments', component: MyAppointmentsComponent, canActivate: [AuthGuard] },
  { path: 'appointment-details/:referenceNumber', component: AppointmentDetailsComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
