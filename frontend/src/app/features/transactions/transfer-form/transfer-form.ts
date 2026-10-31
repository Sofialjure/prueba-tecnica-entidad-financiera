import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { TransactionReceipt } from '../../../core/models/transaction';
import { NotificationService } from '../../../core/notification/notification.service';
import { MoneyInput } from '../../../shared/forms/money-input';
import { validationMessage } from '../../../shared/forms/validation-message';
import { maxDecimals } from '../../../shared/forms/validators';
import { AccountNumberPipe } from '../../../shared/pipes/account-number.pipe';
import { LabelPipe } from '../../../shared/pipes/label.pipe';
import { AccountOption } from '../account-option';
import { AccountSummary } from '../account-summary/account-summary';
import { gmfFor } from '../gmf';
import { TransactionService } from '../transaction.service';

/** Transfer between two active accounts; emits the receipt when the API accepts it (RF-22). */
@Component({
  selector: 'app-transfer-form',
  imports: [
    AccountNumberPipe,
    AccountSummary,
    CurrencyPipe,
    LabelPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MoneyInput,
    ReactiveFormsModule,
  ],
  templateUrl: './transfer-form.html',
  styleUrls: ['../operation-form.scss', './transfer-form.scss'],
})
export class TransferForm {
  private readonly transactionService = inject(TransactionService);
  private readonly notifications = inject(NotificationService);
  private readonly accountNumber = new AccountNumberPipe();
  private readonly currency = new CurrencyPipe('es-CO', 'COP');

  readonly options = input.required<AccountOption[]>();
  /** Source account to preselect, e.g. when coming from an account card. */
  readonly initialAccount = input<string>();
  readonly completed = output<TransactionReceipt>();

  protected readonly saving = signal(false);

  protected readonly form = inject(FormBuilder).group({
    sourceAccountNumber: ['', Validators.required],
    targetAccountNumber: ['', Validators.required],
    amount: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0.01),
        maxDecimals(2),
        (c: AbstractControl) => this.coversAmount(c),
      ],
    ],
    description: ['', Validators.maxLength(255)],
  });

  private readonly values = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  protected readonly source = computed(() => this.find(this.values().sourceAccountNumber));
  protected readonly target = computed(() => this.find(this.values().targetAccountNumber));

  /** A transfer to the same account makes no sense (SUP-06), so the source is not offered. */
  protected readonly targetOptions = computed(() =>
    this.options().filter(
      (option) => option.account.accountNumber !== this.values().sourceAccountNumber,
    ),
  );

  protected readonly amount = computed(() => Number(this.values().amount || 0));
  protected readonly gmf = computed(() => {
    const source = this.source();
    return source ? gmfFor(source.account, this.amount()) : 0;
  });
  protected readonly total = computed(() => this.amount() + this.gmf());

  constructor() {
    effect(() => {
      const initial = this.initialAccount();
      if (initial && this.options().some((option) => option.account.accountNumber === initial)) {
        this.form.controls.sourceAccountNumber.setValue(initial);
      }
    });
    effect(() => {
      const source = this.source();
      // Choosing as source the account that was the target clears the target
      if (source && source.account.accountNumber === this.form.controls.targetAccountNumber.value) {
        this.form.controls.targetAccountNumber.setValue('');
      }
      this.form.controls.amount.updateValueAndValidity({ emitEvent: false });
    });
  }

  protected amountError(): string {
    const errors = this.form.controls.amount.errors;
    if (errors?.['insufficient']) {
      return `Saldo disponible insuficiente en la cuenta de origen: ${this.money(errors['insufficient'].available, '1.2-2')}`;
    }
    return validationMessage(errors, { min: 'El monto debe ser mayor a $0' });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { sourceAccountNumber, targetAccountNumber, amount, description } =
      this.form.getRawValue();
    this.saving.set(true);
    this.transactionService
      .transfer({
        sourceAccountNumber: sourceAccountNumber!,
        targetAccountNumber: targetAccountNumber!,
        amount: amount!,
        description: description?.trim() || undefined,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (receipt) => {
          this.notifications.success(
            `Transferencia de ${this.money(amount!, '1.0-2')} de la cuenta ${this.accountNumber.transform(sourceAccountNumber)} a la ${this.accountNumber.transform(targetAccountNumber)} realizada`,
          );
          this.form.reset({
            sourceAccountNumber,
            targetAccountNumber: '',
            amount: null,
            description: '',
          });
          this.completed.emit(receipt);
        },
        // The error interceptor already showed the API message
        error: () => undefined,
      });
  }

  private find(accountNumber: string | null | undefined): AccountOption | null {
    return this.options().find((option) => option.account.accountNumber === accountNumber) ?? null;
  }

  private money(value: number, digits: string): string {
    return this.currency.transform(value, 'COP', 'symbol-narrow', digits) ?? '';
  }

  /** The source must cover the amount plus its 4x1000 (RF-14, SUP-01, SUP-10). */
  private coversAmount(control: AbstractControl): ValidationErrors | null {
    // Runs once while the form is being built, before `source` exists and inputs are set
    const source = this.source?.();
    const amount = Number(control.value);
    if (!source || !(amount > 0)) {
      return null;
    }
    const available = source.account.availableBalance;
    return amount + gmfFor(source.account, amount) > available
      ? { insufficient: { available } }
      : null;
  }
}
