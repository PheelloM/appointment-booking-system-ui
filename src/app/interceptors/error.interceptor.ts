import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MessageService } from '../services/message.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private messageService: MessageService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unknown error occurred!';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          switch (error.status) {
            case 400:
              errorMessage = this.getBadRequestMessage(error);
              break;
            case 401:
              errorMessage = 'Your session has expired. Please log in again.';
              this.router.navigate(['/login']);
              break;
            case 403:
              errorMessage = 'You do not have permission to perform this action.';
              break;
            case 404:
              errorMessage = 'The requested resource was not found.';
              break;
            case 409:
              errorMessage = 'This time slot is already booked. Please choose another time.';
              break;
            case 422:
              errorMessage = this.getValidationErrorMessage(error);
              break;
            case 500:
              errorMessage = 'Internal server error. Please try again later.';
              break;
            case 503:
              errorMessage = 'Service temporarily unavailable. Please try again later.';
              break;
            default:
              errorMessage = `Error ${error.status}: ${error.message}`;
          }
        }

        // Show error message to user
        this.messageService.showError(errorMessage);

        return throwError(() => error);
      })
    );
  }

  private getBadRequestMessage(error: HttpErrorResponse): string {
    if (error.error?.message) {
      return error.error.message;
    }
    return 'Bad request. Please check your input.';
  }

  private getValidationErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.errors) {
      const errors = error.error.errors;
      return Object.values(errors).flat().join(', ');
    }
    return 'Validation failed. Please check your input.';
  }
}
