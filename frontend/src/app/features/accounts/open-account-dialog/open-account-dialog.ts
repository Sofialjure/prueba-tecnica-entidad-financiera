import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs';
import { Account } from '../../../core/models/account';
import { AccountType } from '../../../core/models/enums';
import { validationMessage } from '../../../shared/forms/validation-message';
import { MoneyInput } from '../../../shared/forms/money-input';
import { maxDecimals } from '../../../shared/forms/validators';
import { AccountService } from '../account.service';

export interface OpenAccountDialogData {
  customerId: number;
  customerName: string;
}

interface TypeOption {
  value: AccountType;
  icon: string;
  title: string;
  description: string;
}

/** Opens an account for a customer; closes with the new account, or with nothing if cancelled. */
@Component({
  selector: 'app-open-account-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    MoneyInput,
    ReactiveFormsModule,
  ],
  templateUrl: './open-account-dialog.html',
  styleUrl: './open-account-dialog.scss',
})
export class OpenAccountDialog {
  protected readonly data = inject<OpenAccountDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<OpenAccountDialog, Account>>(MatDialogRef);
  private readonly accountService = inject(AccountService);

  protected readonly saving = signal(false);
  protected readonly types: TypeOption[] = [
    {
      value: 'SAVINGS',
      icon: 'savings',
      title: 'Ahorros',
      description: 'Número 53… · el saldo nunca baja de $0',
    },
    {
      value: 'CHECKING',
      icon: 'account_balance',
      title: 'Corriente',
      description: 'Número 33… · admite cupo de sobregiro',
    },
  ];

  protected readonly form = inject(FormBuilder).nonNullable.group({
    accountType: ['SAVINGS' as AccountType, Validators.required],
    overdraftLimit: [0, [Validators.required, Validators.min(0), maxDecimals(2)]],
    gmfExempt: [false],
  });

  protected readonly accountType = toSignal(this.form.controls.accountType.valueChanges, {
    initialValue: this.form.controls.accountType.value,
  });

  protected selectType(type: AccountType): void {
    this.form.controls.accountType.setValue(type);
    // Savings accounts cannot have an overdraft (SUP-01)
    if (type === 'SAVINGS') {
      this.form.controls.overdraftLimit.setValue(0);
    }
  }

  protected overdraftError(): string {
    return validationMessage(this.form.controls.overdraftLimit.errors, {
      min: 'El cupo de sobregiro no puede ser negativo',
    });
  }

  protected open(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.accountService
      .open({ customerId: this.data.customerId, ...this.form.getRawValue() })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (account) => this.dialogRef.close(account),
        // The error interceptor already showed the API message
        error: () => undefined,
      });
  }
}
