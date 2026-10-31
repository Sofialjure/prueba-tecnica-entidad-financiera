import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../notification/notification.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  const notifications = { error: vi.fn(), success: vi.fn() };

  beforeEach(() => {
    notifications.error.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notifications },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('shows the API message and still lets the caller see the error', () => {
    let failed = false;
    http.delete('/api/v1/customers/1').subscribe({ error: () => (failed = true) });

    httpTesting
      .expectOne('/api/v1/customers/1')
      .flush(
        { detail: 'El cliente con id 1 tiene productos vinculados y no se puede eliminar' },
        { status: 409, statusText: 'Conflict' },
      );

    expect(notifications.error).toHaveBeenCalledWith(
      'El cliente con id 1 tiene productos vinculados y no se puede eliminar',
    );
    expect(failed).toBe(true);
  });

  it('does not notify successful responses', () => {
    http.get('/api/v1/customers').subscribe();

    httpTesting.expectOne('/api/v1/customers').flush([]);

    expect(notifications.error).not.toHaveBeenCalled();
  });
});
