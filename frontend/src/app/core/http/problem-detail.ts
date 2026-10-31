/** Error body returned by the API (RFC 7807), see GlobalExceptionHandler in the backend. */
export interface ProblemDetail {
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}
