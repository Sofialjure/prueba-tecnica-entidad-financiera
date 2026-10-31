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

/** Body of POST and PUT /api/v1/customers; the dates are set by the API. */
export type CustomerRequest = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
