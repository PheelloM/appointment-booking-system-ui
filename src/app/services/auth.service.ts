import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LoginRequest } from '../models/login-request.interface';
import { LoginResponse } from '../models/login-response.interface';
import { UserProfile } from '../models/user-profile.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly USER_PROFILE_KEY = 'user_profile';

  private authenticatedSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
  public authenticated$ = this.authenticatedSubject.asObservable();

  private userProfileSubject = new BehaviorSubject<UserProfile | null>(this.getUserProfile());
  public userProfile$ = this.userProfileSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check token validity on service initialization
    this.checkTokenValidity();
  }

  login(loginRequest: LoginRequest): Observable<LoginResponse> {
    console.log('AuthService: Attempting login for user:', loginRequest.username);
    return this.http.post<LoginResponse>(`${environment.authUrl}/login`, loginRequest).pipe(
      tap(response => {
        console.log('AuthService: Login successful, storing token');
        this.storeToken(response.accessToken);
        this.storeUserProfile(response);
        this.authenticatedSubject.next(true);
      }),
      catchError(error => {
        console.error('AuthService: Login error:', error);
        this.logout();
        throw error;
      })
    );
  }

  logout(showConfirmation: boolean = true): void {
  if (showConfirmation) {
    const confirmed = confirm('Are you sure you want to logout?');
    if (!confirmed) {
      return;
    }
  }
  
  console.log('AuthService: Logging out user');
  localStorage.removeItem(this.ACCESS_TOKEN_KEY);
  localStorage.removeItem(this.USER_PROFILE_KEY);
  this.authenticatedSubject.next(false);
  this.userProfileSubject.next(null);
  
  // Redirect to login page
  window.location.href = '/login';
}

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }
    
    // Simple token validation
    return true;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getUserProfile(): UserProfile | null {
    const profile = localStorage.getItem(this.USER_PROFILE_KEY);
    return profile ? JSON.parse(profile) : null;
  }

  hasRole(role: string): boolean {
    const profile = this.getUserProfile();
    return profile ? profile.roles.includes(role) : false;
  }

  hasAnyRole(roles: string[]): boolean {
    const profile = this.getUserProfile();
    return profile ? roles.some(role => profile.roles.includes(role)) : false;
  }

  private storeToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  private storeUserProfile(loginResponse: LoginResponse): void {
  const userProfile: UserProfile = {
    id: loginResponse.username,
    username: loginResponse.username,
    email: loginResponse.username || `${loginResponse.username}@example.com`,
    roles: loginResponse.roles
  };

  localStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(userProfile));
  this.userProfileSubject.next(userProfile);
}

  // Get current user info from backend
  getCurrentUser(): Observable<UserProfile> {
    return this.http.get<any>(`${environment.authUrl}/user`).pipe(
      map(response => {
        const userProfile: UserProfile = {
          id: response.id || response.username,
          username: response.username,
          email: response.email || `${response.username}@example.com`,
          roles: response.roles
        };
        this.userProfileSubject.next(userProfile);
        return userProfile;
      })
    );
  }

  private checkTokenValidity(): void {
    if (this.isAuthenticated()) {
      // Verify token is still valid by making a test request
      this.getCurrentUser().subscribe({
        error: (error) => {
          console.error('AuthService: Token validation failed, logging out', error);
          this.logout();
        }
      });
    }
  }
}