import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CustomerRequest } from '../../../core/models/customer';
import { IdentificationType } from '../../../core/models/enums';
import { NotificationService } from '../../../core/notification/notification.service';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { fromIsoDate, toIsoDate } from '../../../shared/forms/dates';
import { validationMessage } from '../../../shared/forms/validation-message';
import {
  latestAdultBirthDate,
  legalAge,
  trimmedMinLength,
} from '../../../shared/forms/validators';
import { LABELS } from '../../../shared/labels';
import { CustomerService } from '../customer.service';

const LEGAL_AGE = 18;
/** Same format the API accepts: xxxx@xxxxx.xxx (RF-07). */
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;

/** Creates a customer at /customers/new and edits one at /customers/:id/edit. */
@Component({
  selector: 'app-customer-form',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    PageHeader,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './customer-form.html',
  styleUrl: './customer-form.scss',
})
export class CustomerForm implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  /** Route parameter; empty when creating. */
  readonly id = input<string>();

  protected readonly editing = computed(() => !!this.id());
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly maxBirthDate = latestAdultBirthDate(LEGAL_AGE);
  /** The calendar opens on the year picker around this date. */
  protected readonly calendarStart = new Date(1990, 0, 1);
  protected readonly identificationTypes = Object.entries(LABELS.identificationType) as [
    IdentificationType,
    string,
  ][];

  protected readonly form = inject(FormBuilder).nonNullable.group({
    identificationType: ['CC' as IdentificationType, Validators.required],
    identificationNumber: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{4,20}$/)]],
    firstName: ['', [Validators.required, trimmedMinLength(2), Validators.maxLength(100)]],
    lastName: ['', [Validators.required, trimmedMinLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN), Validators.maxLength(150)]],
    birthDate: [null as Date | null, [Validators.required, legalAge(LEGAL_AGE)]],
  });

  protected readonly messages: Record<string, Record<string, string>> = {
    identificationNumber: { pattern: 'Debe tener entre 4 y 20 letras o números, sin espacios' },
    email: { pattern: 'El correo debe tener el formato xxxx@xxxxx.xxx' },
    birthDate: {
      matDatepickerParse: 'Escriba la fecha como dd/mm/aaaa',
      matDatepickerMax: `El cliente debe ser mayor de edad (${LEGAL_AGE} años cumplidos)`,
    },
  };

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.loading.set(true);
      this.customerService
        .getById(Number(id))
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: ({ id: _, createdAt, updatedAt, birthDate, ...data }) =>
            this.form.setValue({ ...data, birthDate: fromIsoDate(birthDate) }),
          error: () => this.router.navigate(['/customers']),
        });
    }
  }

  protected error(field: keyof typeof this.form.controls): string {
    return validationMessage(this.form.controls[field].errors, this.messages[field]);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { birthDate, ...rest } = this.form.getRawValue();
    const data: CustomerRequest = { ...rest, birthDate: toIsoDate(birthDate!) };
    const id = this.id();
    const request = id
      ? this.customerService.update(Number(id), data)
      : this.customerService.create(data);

    this.saving.set(true);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (customer) => {
        this.notifications.success(
          `Cliente ${customer.firstName} ${customer.lastName} ${id ? 'actualizado' : 'creado'}`,
        );
        this.router.navigate(['/customers']);
      },
      // The error interceptor already showed the API message (duplicated id, underage...)
      error: () => undefined,
    });
  }
}
