import { Pipe, PipeTransform } from '@angular/core';

/** `5300000003` → `53 0000 0003`: type prefix and two blocks, easier to read aloud. */
@Pipe({ name: 'accountNumber' })
export class AccountNumberPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value || !/^\d{10}$/.test(value)) {
      return value ?? '';
    }
    return `${value.slice(0, 2)} ${value.slice(2, 6)} ${value.slice(6)}`;
  }
}
