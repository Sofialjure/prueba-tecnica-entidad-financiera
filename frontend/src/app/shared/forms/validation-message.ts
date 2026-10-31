import { ValidationErrors } from '@angular/forms';

/**
 * First error of a form control as a Spanish message. `custom` replaces the generic text of
 * a given error, e.g. `{ pattern: 'El correo debe tener el formato xxxx@xxxxx.xxx' }`.
 */
export function validationMessage(
  errors: ValidationErrors | null | undefined,
  custom: Record<string, string> = {},
): string {
  if (!errors) {
    return '';
  }
  const [key, detail] = Object.entries(errors)[0];
  if (custom[key]) {
    return custom[key];
  }
  switch (key) {
    case 'required':
      return 'Este campo es obligatorio';
    case 'minlength':
    case 'trimmedMinLength':
      return `Debe tener al menos ${detail.requiredLength} caracteres`;
    case 'maxlength':
      return `No puede superar ${detail.requiredLength} caracteres`;
    case 'min':
      return `El valor mínimo es ${detail.min}`;
    case 'legalAge':
      return `El cliente debe ser mayor de edad (${detail.years} años cumplidos)`;
    default:
      return 'El valor no es válido';
  }
}
