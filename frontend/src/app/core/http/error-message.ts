import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from './problem-detail';

/** Turns any HTTP error into a message the user can read, preferring the one sent by the API. */
export function errorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'No hay conexión con el servidor. Verifique que la API esté en ejecución.';
  }
  const problem = error.error as ProblemDetail | null;
  if (problem?.errors?.length) {
    return problem.errors.map((fieldError) => fieldError.message).join('. ');
  }
  return problem?.detail ?? 'Ocurrió un error inesperado. Intente nuevamente más tarde.';
}
