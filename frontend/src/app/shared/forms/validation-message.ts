import { ValidationErrors } from '@angular/forms';

/**
 * Error of a form control as a Spanish message. `custom` gives field-specific texts, e.g.
 * `{ pattern: 'El correo debe tener el formato xxxx@xxxxx.xxx' }`; they win over generic ones,
 * so an unreadable date says how to write it instead of "obligatorio".
 */
export function validationMessage(
  errors: ValidationErrors | null | undefined,
  custom: Record<string, string> = {},
): string {
  if (!errors) {
    return '';
  }
  const customKey = Object.keys(errors).find((key) => custom[key]);
  if (customKey) {
    return custom[customKey];
  }
  const [key, detail] = Object.entries(errors)[0];
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
