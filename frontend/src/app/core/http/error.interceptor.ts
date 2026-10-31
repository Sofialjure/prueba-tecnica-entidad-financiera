import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../notification/notification.service';
import { errorMessage } from './error-message';

/** Shows every API error in one place, so screens only handle the success case. */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const notifications = inject(NotificationService);
  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        notifications.error(errorMessage(error));
      }
      return throwError(() => error);
    }),
  );
};
