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
import { validationMessage } from '../../../shared/forms/validation-message';
import { maxDecimals } from '../../../shared/forms/validators';
import { AccountNumberPipe } from '../../../shared/pipes/account-number.pipe';
import { LabelPipe } from '../../../shared/pipes/label.pipe';
import { AccountOption } from '../account-option';
import { gmfFor } from '../gmf';
import { TransactionService } from '../transaction.service';

export type MovementKind = 'deposit' | 'withdrawal';

/** Deposit or withdrawal on one active account; emits the receipt when the API accepts it. */
@Component({
  selector: 'app-movement-form',
  imports: [
    AccountNumberPipe,
    CurrencyPipe,
    LabelPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './movement-form.html',
  styleUrl: './movement-form.scss',
})
export class MovementForm {
  private readonly transactionService = inject(TransactionService);
  private readonly notifications = inject(NotificationService);
  private readonly accountNumber = new AccountNumberPipe();
  private readonly currency = new CurrencyPipe('es-CO', 'COP');

  readonly kind = input.required<MovementKind>();
  readonly options = input.required<AccountOption[]>();
  /** Account number to preselect, e.g. when coming from an account card. */
  readonly initialAccount = input<string>();
  readonly completed = output<TransactionReceipt>();

  protected readonly saving = signal(false);

  protected readonly form = inject(FormBuilder).group({
    accountNumber: ['', Validators.required],
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

  protected readonly selected = computed(
    () =>
      this.options().find(
        (option) => option.account.accountNumber === this.values().accountNumber,
      ) ?? null,
  );

  /** Tax the API will add to a withdrawal; deposits never pay it. */
  protected readonly gmf = computed(() => {
    const selected = this.selected();
    const amount = Number(this.values().amount);
    return this.kind() === 'withdrawal' && selected ? gmfFor(selected.account, amount) : 0;
  });

  protected readonly total = computed(() => Number(this.values().amount || 0) + this.gmf());

  constructor() {
    effect(() => {
      const initial = this.initialAccount();
      if (initial && this.options().some((option) => option.account.accountNumber === initial)) {
        this.form.controls.accountNumber.setValue(initial);
      }
    });
    // The balance check depends on the chosen account and on whether it is a withdrawal
    effect(() => {
      this.selected();
      this.kind();
      this.form.controls.amount.updateValueAndValidity({ emitEvent: false });
    });
  }

  protected amountError(): string {
    const errors = this.form.controls.amount.errors;
    if (errors?.['insufficient']) {
      return `Saldo disponible insuficiente: ${this.currency.transform(errors['insufficient'].available, 'COP', 'symbol-narrow', '1.2-2')}`;
    }
    return validationMessage(errors, { min: 'El monto debe ser mayor a $0' });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { accountNumber, amount, description } = this.form.getRawValue();
    const request = {
      accountNumber: accountNumber!,
      amount: amount!,
      description: description?.trim() || undefined,
    };
    const call =
      this.kind() === 'deposit'
        ? this.transactionService.deposit(request)
        : this.transactionService.withdraw(request);

    this.saving.set(true);
    call.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (receipt) => {
        const what = this.kind() === 'deposit' ? 'Consignación' : 'Retiro';
        const done = this.kind() === 'deposit' ? 'realizada' : 'realizado';
        this.notifications.success(
          `${what} de ${this.currency.transform(amount, 'COP', 'symbol-narrow', '1.0-2')} ${done} en la cuenta ${this.accountNumber.transform(accountNumber)}`,
        );
        this.form.reset({ accountNumber, amount: null, description: '' });
        this.completed.emit(receipt);
      },
      // The error interceptor already showed the API message
      error: () => undefined,
    });
  }

  /** A withdrawal plus its GMF must fit in the available balance (RF-14, SUP-01, SUP-10). */
  private coversAmount(control: AbstractControl): ValidationErrors | null {
    // Runs once while the form is being built, before `selected` exists and inputs are set
    const selected = this.selected?.();
    const amount = Number(control.value);
    if (!selected || this.kind() !== 'withdrawal' || !(amount > 0)) {
      return null;
    }
    const available = selected.account.availableBalance;
    return amount + gmfFor(selected.account, amount) > available
      ? { insufficient: { available } }
      : null;
  }
}
