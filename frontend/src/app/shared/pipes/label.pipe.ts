import { Pipe, PipeTransform } from '@angular/core';
import { LABELS, LabelKind } from '../labels';

/** `{{ account.accountType | label: 'accountType' }}` → "Ahorros". Unknown values are shown as they come. */
@Pipe({ name: 'label' })
export class LabelPipe implements PipeTransform {
  transform(value: string | null | undefined, kind: LabelKind): string {
    if (value == null) {
      return '';
    }
    return (LABELS[kind] as Record<string, string>)[value] ?? value;
  }
}
