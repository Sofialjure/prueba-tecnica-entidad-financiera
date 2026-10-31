import { IdentificationType } from './enums';

/** Customer as returned by GET /api/v1/customers. Dates come as ISO strings. */
export interface Customer {
  id: number;
  identificationType: IdentificationType;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  createdAt: string;
  updatedAt: string;
}
