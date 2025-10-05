import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip adding auth header for public endpoints
    if (this.isPublicRequest(request)) {
      return next.handle(request);
    }

    // Get the auth token from the service.
    const authToken = this.authService.getAccessToken();

    // Clone the request and add the authorization header if an auth token exists.
    if (authToken) {
      const authReq = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${authToken}`)
      });
      console.log('AuthInterceptor: Adding Bearer token to request');
      return next.handle(authReq);
    }

    console.log('AuthInterceptor: No token available for protected request');
    return next.handle(request);
  }

  private isPublicRequest(request: HttpRequest<unknown>): boolean {
    const publicEndpoints = [
      `${environment.authUrl}/login`,
      `${environment.authUrl}/register`,
      '/api/branches',
      '/api/timeslots/available'
    ];

    // Check if the request URL matches any public endpoint
    const isPublic = publicEndpoints.some(endpoint => 
      request.url.includes(endpoint)
    );

    console.log(`AuthInterceptor: Request to ${request.url} is public: ${isPublic}`);
    return isPublic;
  }
}