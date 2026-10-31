import { HttpErrorResponse } from '@angular/common/http';
import { errorMessage } from './error-message';

describe('errorMessage', () => {
  it('uses the detail sent by the API', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: { title: 'Regla de negocio violada', detail: 'Saldo disponible insuficiente en la cuenta 5300000001' },
    });

    expect(errorMessage(error)).toBe('Saldo disponible insuficiente en la cuenta 5300000001');
  });

  it('joins the field errors of a validation failure', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        detail: 'La solicitud contiene campos inválidos',
        errors: [
          { field: 'email', message: 'El correo electrónico debe tener el formato xxxx@xxxxx.xxx' },
          { field: 'firstName', message: 'Los nombres deben tener entre 2 y 100 caracteres' },
        ],
      },
    });

    expect(errorMessage(error)).toBe(
      'El correo electrónico debe tener el formato xxxx@xxxxx.xxx. Los nombres deben tener entre 2 y 100 caracteres',
    );
  });

  it('explains when the server cannot be reached', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain('No hay conexión con el servidor');
  });

  it('falls back to a generic message when the body is not a problem detail', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 502, error: '<html>Bad gateway</html>' }))).toBe(
      'Ocurrió un error inesperado. Intente nuevamente más tarde.',
    );
  });
});
