# 7. Trazabilidad: requisito → implementación → prueba

Cada requisito del enunciado ([Requerimientos](01-requerimientos.md)) con el lugar donde se implementa y las pruebas automáticas que lo demuestran. Todas las pruebas se ejecutan en cada Pull Request con GitHub Actions ([Despliegue §6.2](06-despliegue.md#62-integración-continua)).

Rutas abreviadas: `domain/…`, `application/…` e `infrastructure/…` cuelgan de `backend/src/main/java/com/pruebatecnica/entidadfinanciera/`; las de `features/…` cuelgan de `frontend/src/app/`. Las pruebas se citan como `Clase.método`.

## Clientes

| Requisito | Dónde se implementa | Pruebas que lo demuestran |
|---|---|---|
| **RF-01** Crear cliente | `Customer.create`, `CustomerService.create`, `POST /customers`; pantalla `features/customers/customer-form` | `CustomerServiceTest.createSavesNewCustomer`, `CustomerControllerTest.createReturns201WithLocationAndBody`, `customer-form.spec.ts` |
| **RF-02** Consultar clientes | `CustomerService.getAll/getById`, `GET /customers`, `GET /customers/{id}`; `customer-list`, `customer-detail` | `CustomerServiceTest.getAllReturnsEveryCustomer`, `CustomerServiceTest.getByIdFailsWhenCustomerDoesNotExist`, `CustomerControllerTest.getByIdReturns404WhenCustomerDoesNotExist` |
| **RF-03** Actualizar con fecha de modificación automática | `Customer.update` con el `Clock` del sistema, `PUT /customers/{id}` | `CustomerTest.updateChangesDataAndModificationDateButKeepsCreationDate`, `CustomerServiceTest.updateChangesDataAndModificationDate` |
| **RF-04** No eliminar clientes con productos | `CustomerService.delete` (409) y `fk_accounts_customer ON DELETE RESTRICT` | `CustomerServiceTest.deleteRejectsCustomerWithAccounts`, `CustomerControllerTest.deleteReturns409WhenCustomerHasAccounts`, `DatabaseMigrationTest.rejectsDeletingCustomerWithAccounts` |
| **RF-05** Ningún menor de edad | `Customer` (dominio), `ck_customers_legal_age` (base de datos), validador `legalAge` (formulario) | `CustomerTest.rejectsCustomerWhoTurns18Tomorrow`, `CustomerTest.acceptsCustomerWhoTurns18Today`, `CustomerServiceTest.createRejectsUnderageCustomerWithoutSaving`, `DatabaseMigrationTest.rejectsUnderageCustomer`, `validators.spec.ts` |
| **RF-06** Fecha de creación automática | `Customer.create` | `CustomerTest.createSetsCreationAndModificationDatesAutomatically` |
| **RF-07** Correo `xxxx@xxxxx.xxx` | `Customer.EMAIL_REGEX` en dominio, DTO y formulario | `CustomerTest.rejectsInvalidEmail`, `CustomerControllerTest.createReturns400WhenFieldsAreInvalid`, `customer-form.spec.ts` |
| **RF-08** Nombres de mínimo 2 caracteres | `Customer`, `ck_customers_name_length`, validador `trimmedMinLength` | `CustomerTest.rejectsFirstNameShorterThanTwoCharacters`, `CustomerTest.rejectsLastNameShorterThanTwoCharacters` |

## Cuentas

| Requisito | Dónde se implementa | Pruebas que lo demuestran |
|---|---|---|
| **RF-09** Solo ahorros o corriente | `AccountType` (Strategy: `SavingsAccountPolicy`, `CheckingAccountPolicy`), `ck_accounts_account_type` | `AccountTypePolicyTest`, `AccountControllerTest.openReturns400WhenAccountTypeIsUnknown` |
| **RF-10** Siempre ligada a un cliente existente | `AccountService.open`, `fk_accounts_customer` | `AccountServiceTest.openFailsWhenCustomerDoesNotExist`, `AccountControllerTest.openReturns404WhenCustomerDoesNotExist` |
| **RF-11** Atributos de la cuenta | `Account`, tabla `accounts`, `AccountResponse` | `AccountTest.openCreatesActiveSavingsAccountWithZeroBalance`, `AccountControllerTest.openReturns201WithLocationAndBody` |
| **RF-12** Número único, automático, 10 dígitos, 53 / 33 | `AccountFactory` (Factory) + secuencias de PostgreSQL, `uk_accounts_account_number`, `ck_accounts_account_number_prefix` | `AccountFactoryTest.savingsNumberStartsWith53AndHasTenDigits`, `AccountFactoryTest.checkingNumberStartsWith33AndHasTenDigits`, `AccountPersistenceAdapterTest.sequencesContinueAfterSeedNumbers`, `DatabaseMigrationTest.rejectsAccountNumberWithWrongPrefixForItsType` |
| **RF-13** Ahorros nace activa | `Account.open` | `AccountTest.openCreatesActiveSavingsAccountWithZeroBalance` |
| **RF-14** Ahorros nunca por debajo de $0 | `SavingsAccountPolicy`, `Account.debit`, `ck_accounts_minimum_balance` | `AccountTest.savingsDebitCannotLeaveBalanceBelowZero`, `AccountTypePolicyTest.savingsNeverGoesBelowZero`, `DatabaseMigrationTest.rejectsNegativeBalanceOnSavingsAccount` |
| **RF-15** Activar e inactivar | `Account.activate/deactivate`, `PATCH /accounts/{id}/activate|deactivate`; menú de la tarjeta | `AccountTest.deactivateAndActivateChangeStatusAndModificationDate`, `AccountControllerTest.activateReturnsActiveAccount`, `account-card.spec.ts` |
| **RF-16** Cancelar solo con saldo $0 | `Account.cancel`, `ck_accounts_cancelled_zero_balance`; opción deshabilitada en la tarjeta | `AccountTest.cancelRejectsAccountWithPositiveBalance`, `AccountTest.cancelRejectsOverdrawnCheckingAccount`, `DatabaseMigrationTest.rejectsCancellingAccountWithNonZeroBalance` |
| **RF-17** Fechas automáticas de la cuenta | `Account.open` y cada cambio de estado o saldo | `AccountTest.deactivateAndActivateChangeStatusAndModificationDate`, `AccountTest.creditRaisesBalanceAndReturnsMovement` |
| **RF-18** Saldo actualizado en cada transacción | `Account.credit/debit` dentro de `TransactionService` | `TransactionServiceTest.depositCreditsAccountAndSavesOneMovement`, `DatabaseMigrationTest.seedBalancesMatchTheLastMovementOfEachAccount` |
| **RF-19** Consultar una cuenta y las de un cliente | `GET /accounts/{id}`, `GET /customers/{id}/accounts`; `customer-detail` | `AccountServiceTest.getByCustomerIdReturnsCustomerAccounts`, `AccountControllerTest.getByCustomerIdReturnsCustomerAccounts`, `customer-detail.spec.ts` |

## Transacciones

| Requisito | Dónde se implementa | Pruebas que lo demuestran |
|---|---|---|
| **RF-20** Consignación (crédito) | `TransactionService.deposit`, `POST /transactions/deposits`; `movement-form` | `TransactionServiceTest.depositCreditsAccountAndSavesOneMovement`, `TransactionControllerTest.depositReturns201WithReceipt`, `movement-form.spec.ts` |
| **RF-21** Retiro (débito) | `TransactionService.withdraw`, `POST /transactions/withdrawals` | `TransactionServiceTest.withdrawalChargesGmfOnNonExemptAccount`, `TransactionServiceTest.withdrawalFailsWhenBalanceDoesNotCoverAmountPlusGmf`, `TransactionControllerTest.withdrawalReturns422WhenBalanceIsInsufficient` |
| **RF-22** Transferencia: débito en origen y crédito en destino | `TransactionService.transfer`, `POST /transactions/transfers`; `transfer-form` | `TransactionServiceTest.transferDebitsSourceChargesGmfAndCreditsTarget`, `TransactionServiceTest.transferRejectsSameAccount`, `TransactionServiceTest.transferFailsWhenTargetDoesNotExist`, `transfer-form.spec.ts` |
| **RF-23** Saldo y saldo disponible | `Account.getAvailableBalance` (saldo + cupo de sobregiro), columna generada `available_balance` | `AccountTest.availableBalanceAddsOverdraftToBalance`, `DatabaseMigrationTest.availableBalanceIsGeneratedFromBalanceAndOverdraftLimit`, `AccountTest.checkingDebitCanUseOverdraftUpToItsLimit` |
| **RF-24** Estado de cuenta | `TransactionService.getStatement`, `GET /accounts/{id}/transactions`; `account-statement` (con CSV) | `TransactionServiceTest.statementReturnsAccountAndItsMovements`, `TransactionControllerTest.statementReturnsAccountAndMovements`, `account-statement.spec.ts` |

## Requisitos no funcionales

| Requisito | Dónde se implementa | Evidencia |
|---|---|---|
| **RNF-02/04** Hexagonal con capas entity, service, controller y repository | Paquetes `domain`, `application.service`, `infrastructure.adapter.in.rest.controller`, `infrastructure.adapter.out.persistence` ([Arquitectura](02-arquitectura.md), [ADR-0001](adr/0001-arquitectura-hexagonal.md)) | — |
| **RNF-05** Tests JUnit sobre Service y Controller | `backend/src/test` | **100 %** de líneas y ramas en Service y Controller, exigido por `jacoco:check`; el build falla si baja |
| **RNF-06** Git Flow | Ramas `feature/*`, `release/*`, `main`, `develop` ([Git Flow](05-git-flow.md)) | Historial de Pull Requests |
| **RNF-07** Dockerizada | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` | Pipelines que construyen las imágenes en cada PR |
| **RNF-09** ACID | `@Transactional` en los servicios | `TransactionServiceTest.withdrawalFailsWhenBalanceDoesNotCoverAmountPlusGmf` (no guarda nada si falla el GMF), `TransactionServiceTest.transferRejectsInactiveTargetWithoutSaving` |
| **RNF-10** Concurrencia | Bloqueo pesimista ordenado por id ([ADR-0004](adr/0004-concurrencia-y-saldos.md)) | `TransactionConcurrencyTest.simultaneousWithdrawalsNeverSpendMoreThanTheBalance`, `TransactionConcurrencyTest.oppositeTransfersAtTheSameTimeDoNotDeadlockNorLoseMoney`, `TransactionPersistenceAdapterTest.locksAccountsInAscendingIdOrderWhateverTheRequestOrder` |
| **RNF-12** Errores uniformes (RFC 7807) | `GlobalExceptionHandler`; interceptor de errores del frontend | `GlobalExceptionHandlerTest`, `error.interceptor.spec.ts` |
| **RNF-14** Precisión monetaria | `BigDecimal` y `NUMERIC(19,2)` | `GmfTest.chargesFourPerThousandRoundedToCents`, `TransactionControllerTest.depositReturns400WhenAmountHasMoreThanTwoDecimals` |
| **RNF-15** Nube y CI | Azure ([ADR-0006](adr/0006-despliegue-en-azure.md)) y GitHub Actions | https://entidad-financiera-sofia.northcentralus.cloudapp.azure.com |

## Supuestos propios con prueba

| Supuesto | Pruebas |
|---|---|
| **SUP-01/02** Sobregiro en corriente y saldo disponible | `AccountTest.checkingDebitCanUseOverdraftUpToItsLimit`, `DatabaseMigrationTest.allowsCheckingAccountOverdraftUpToItsLimit`, `overdraft.spec.ts` |
| **SUP-04** Cancelada es definitiva | `AccountTest.cancelledAccountCannotBeReactivatedNorInactivated` |
| **SUP-05** Inactivas y canceladas no transaccionan | `AccountTest.inactiveOrCancelledAccountsDoNotAllowMovements` |
| **SUP-06** Monto positivo y no a la misma cuenta | `AccountTest.movementAmountMustBePositive`, `DatabaseMigrationTest.rejectsNonPositiveTransactionAmount`, `TransactionServiceTest.transferRejectsSameAccount` |
| **SUP-07** Identificación única | `CustomerServiceTest.createRejectsDuplicatedIdentification`, `DatabaseMigrationTest.rejectsDuplicatedIdentification` |
| **SUP-10** GMF 4x1000 | `AccountTest.chargeGmfDebitsFourPerThousandOnNonExemptAccount`, `AccountTest.chargeGmfSkipsExemptAccount`, `gmf.spec.ts` |
| **SUP-14** Cancelar cierra el cupo | `AccountTest.cancelClosesTheOverdraftLineSoNothingIsAvailable`, `DatabaseMigrationTest.rejectsCancelledAccountThatKeepsAnOverdraft` |
| **SUP-15** Una cuenta de cada tipo por cliente | `AccountServiceTest.openRejectsASecondOpenAccountOfTheSameType`, `DatabaseMigrationTest.rejectsASecondOpenAccountOfTheSameTypeForACustomer`, `open-account-dialog.spec.ts` |
