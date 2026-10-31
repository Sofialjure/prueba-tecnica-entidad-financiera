import { validationMessage } from './validation-message';

describe('validationMessage', () => {
  it('returns nothing when there is no error', () => {
    expect(validationMessage(null)).toBe('');
  });

  it('describes the common validators in Spanish', () => {
    expect(validationMessage({ required: true })).toBe('Este campo es obligatorio');
    expect(validationMessage({ trimmedMinLength: { requiredLength: 2 } })).toBe(
      'Debe tener al menos 2 caracteres',
    );
    expect(validationMessage({ minlength: { requiredLength: 4 } })).toBe(
      'Debe tener al menos 4 caracteres',
    );
    expect(validationMessage({ maxlength: { requiredLength: 100 } })).toBe(
      'No puede superar 100 caracteres',
    );
    expect(validationMessage({ min: { min: 0.01 } })).toBe('El valor mínimo es 0.01');
    expect(validationMessage({ legalAge: { years: 18 } })).toBe(
      'El cliente debe ser mayor de edad (18 años cumplidos)',
    );
    expect(validationMessage({ somethingElse: true })).toBe('El valor no es válido');
  });

  it('uses the custom text of the field when there is one', () => {
    expect(
      validationMessage({ pattern: {} }, { pattern: 'El correo debe tener el formato xxxx@xxxxx.xxx' }),
    ).toBe('El correo debe tener el formato xxxx@xxxxx.xxx');
  });
});
