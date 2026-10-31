package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.controller;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pruebatecnica.entidadfinanciera.domain.exception.BusinessRuleViolationException;
import com.pruebatecnica.entidadfinanciera.domain.exception.ResourceNotFoundException;
import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountStatement;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountStatus;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountType;
import com.pruebatecnica.entidadfinanciera.domain.model.EntryType;
import com.pruebatecnica.entidadfinanciera.domain.model.MovementData;
import com.pruebatecnica.entidadfinanciera.domain.model.Transaction;
import com.pruebatecnica.entidadfinanciera.domain.model.TransactionReceipt;
import com.pruebatecnica.entidadfinanciera.domain.model.TransactionType;
import com.pruebatecnica.entidadfinanciera.domain.model.TransferData;
import com.pruebatecnica.entidadfinanciera.domain.port.in.DepositUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.GetAccountStatementUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.TransferUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.WithdrawUseCase;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.mapper.AccountRestMapperImpl;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.mapper.TransactionRestMapperImpl;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(TransactionController.class)
@Import({TransactionRestMapperImpl.class, AccountRestMapperImpl.class})
class TransactionControllerTest {

    private static final UUID REFERENCE = UUID.fromString("7f1c2b9e-4a7d-4f0e-9c1a-2f3b4c5d6e7f");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 30, 10, 0);

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DepositUseCase deposit;
    @MockitoBean
    private WithdrawUseCase withdraw;
    @MockitoBean
    private TransferUseCase transfer;
    @MockitoBean
    private GetAccountStatementUseCase statement;

    @Test
    void depositReturns201WithReceipt() throws Exception {
        when(deposit.deposit(new MovementData("5300000001", new BigDecimal("50000.00"), "Nómina")))
                .thenReturn(new TransactionReceipt(REFERENCE, List.of(movement("5300000001",
                        TransactionType.DEPOSIT, EntryType.CREDIT, "50000.00", "1849200.00", "Nómina"))));

        mockMvc.perform(post("/api/v1/transactions/deposits").contentType(MediaType.APPLICATION_JSON).content("""
                        {"accountNumber": "5300000001", "amount": 50000.00, "description": "Nómina"}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reference").value(REFERENCE.toString()))
                .andExpect(jsonPath("$.entries.length()").value(1))
                .andExpect(jsonPath("$.entries[0].accountNumber").value("5300000001"))
                .andExpect(jsonPath("$.entries[0].type").value("DEPOSIT"))
                .andExpect(jsonPath("$.entries[0].entryType").value("CREDIT"))
                .andExpect(jsonPath("$.entries[0].amount").value(50000))
                .andExpect(jsonPath("$.entries[0].balanceAfter").value(1849200))
                .andExpect(jsonPath("$.entries[0].createdAt").value("2026-10-30T10:00:00"));
    }

    @Test
    void depositReturns400WhenFieldsAreInvalid() throws Exception {
        mockMvc.perform(post("/api/v1/transactions/deposits").contentType(MediaType.APPLICATION_JSON).content("""
                        {"accountNumber": "1234", "amount": 0}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].message",
                        hasItem("El número de cuenta debe tener 10 dígitos y empezar por 53 o 33")))
                .andExpect(jsonPath("$.errors[*].message", hasItem("El monto debe ser mayor a $0")));
        verifyNoInteractions(deposit);
    }

    @Test
    void depositReturns400WhenAmountHasMoreThanTwoDecimals() throws Exception {
        mockMvc.perform(post("/api/v1/transactions/deposits").contentType(MediaType.APPLICATION_JSON).content("""
                        {"accountNumber": "5300000001", "amount": 10.555}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].message").value("El monto admite máximo 2 decimales"));
    }

    @Test
    void depositReturns404WhenAccountDoesNotExist() throws Exception {
        when(deposit.deposit(any())).thenThrow(new ResourceNotFoundException("No existe la cuenta 5399999999"));

        mockMvc.perform(post("/api/v1/transactions/deposits").contentType(MediaType.APPLICATION_JSON).content("""
                        {"accountNumber": "5399999999", "amount": 10}
                        """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("No existe la cuenta 5399999999"));
    }

    @Test
    void withdrawalReturns201WithMovementAndGmf() throws Exception {
        when(withdraw.withdraw(new MovementData("5300000001", new BigDecimal("100000"), null)))
                .thenReturn(new TransactionReceipt(REFERENCE, List.of(
                        movement("5300000001", TransactionType.WITHDRAWAL, EntryType.DEBIT, "100000.00",
                                "1699200.00", "Retiro"),
                        movement("5300000001", TransactionType.GMF, EntryType.DEBIT, "400.00", "1698800.00",
                                "GMF 4x1000"))));

        mockMvc.perform(post("/api/v1/transactions/withdrawals").contentType(MediaType.APPLICATION_JSON).content("""
                        {"accountNumber": "5300000001", "amount": 100000}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.entries.length()").value(2))
                .andExpect(jsonPath("$.entries[1].type").value("GMF"))
                .andExpect(jsonPath("$.entries[1].amount").value(400));
    }

    @Test
    void withdrawalReturns422WhenBalanceIsInsufficient() throws Exception {
        when(withdraw.withdraw(any()))
                .thenThrow(new BusinessRuleViolationException("Saldo disponible insuficiente en la cuenta 5300000001"));

        mockMvc.perform(post("/api/v1/transactions/withdrawals").contentType(MediaType.APPLICATION_JSON).content("""
                        {"accountNumber": "5300000001", "amount": 99999999}
                        """))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value("Saldo disponible insuficiente en la cuenta 5300000001"));
    }

    @Test
    void transferReturns201WithDebitGmfAndCredit() throws Exception {
        when(transfer.transfer(new TransferData("5300000001", "3300000001", new BigDecimal("100000.00"),
                "Pago arriendo")))
                .thenReturn(new TransactionReceipt(REFERENCE, List.of(
                        movement("5300000001", TransactionType.TRANSFER, EntryType.DEBIT, "100000.00",
                                "1699200.00", "Pago arriendo"),
                        movement("5300000001", TransactionType.GMF, EntryType.DEBIT, "400.00", "1698800.00",
                                "GMF 4x1000"),
                        movement("3300000001", TransactionType.TRANSFER, EntryType.CREDIT, "100000.00",
                                "999600.00", "Pago arriendo"))));

        mockMvc.perform(post("/api/v1/transactions/transfers").contentType(MediaType.APPLICATION_JSON).content("""
                        {"sourceAccountNumber": "5300000001", "targetAccountNumber": "3300000001",
                         "amount": 100000.00, "description": "Pago arriendo"}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.entries.length()").value(3))
                .andExpect(jsonPath("$.entries[0].entryType").value("DEBIT"))
                .andExpect(jsonPath("$.entries[2].accountNumber").value("3300000001"))
                .andExpect(jsonPath("$.entries[2].entryType").value("CREDIT"));
    }

    @Test
    void transferReturns400WhenAccountsAreMissing() throws Exception {
        mockMvc.perform(post("/api/v1/transactions/transfers").contentType(MediaType.APPLICATION_JSON).content("""
                        {"amount": 10}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("sourceAccountNumber")))
                .andExpect(jsonPath("$.errors[*].field", hasItem("targetAccountNumber")));
        verifyNoInteractions(transfer);
    }

    @Test
    void transferReturns422WhenTargetIsTheSameAccount() throws Exception {
        when(transfer.transfer(any()))
                .thenThrow(new BusinessRuleViolationException("No se puede transferir a la misma cuenta"));

        mockMvc.perform(post("/api/v1/transactions/transfers").contentType(MediaType.APPLICATION_JSON).content("""
                        {"sourceAccountNumber": "5300000001", "targetAccountNumber": "5300000001", "amount": 10}
                        """))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value("No se puede transferir a la misma cuenta"));
    }

    @Test
    void statementReturnsAccountAndMovements() throws Exception {
        Account account = Account.builder().id(1L).accountType(AccountType.SAVINGS).accountNumber("5300000001")
                .status(AccountStatus.ACTIVE).balance(new BigDecimal("1799200.00"))
                .overdraftLimit(new BigDecimal("0.00")).customerId(1L).createdAt(NOW).updatedAt(NOW).build();
        when(statement.getStatement(1L)).thenReturn(new AccountStatement(account, List.of(
                movement("5300000001", TransactionType.GMF, EntryType.DEBIT, "800.00", "1799200.00", "GMF 4x1000"),
                movement("5300000001", TransactionType.WITHDRAWAL, EntryType.DEBIT, "200000.00", "1800000.00",
                        "Retiro en cajero"))));

        mockMvc.perform(get("/api/v1/accounts/1/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.account.accountNumber").value("5300000001"))
                .andExpect(jsonPath("$.account.availableBalance").value(1799200))
                .andExpect(jsonPath("$.transactions.length()").value(2))
                .andExpect(jsonPath("$.transactions[0].type").value("GMF"))
                .andExpect(jsonPath("$.transactions[1].description").value("Retiro en cajero"));
    }

    @Test
    void statementReturns404WhenAccountDoesNotExist() throws Exception {
        when(statement.getStatement(99L)).thenThrow(new ResourceNotFoundException("No existe la cuenta con id 99"));

        mockMvc.perform(get("/api/v1/accounts/99/transactions"))
                .andExpect(status().isNotFound());
    }

    private static Transaction movement(String accountNumber, TransactionType type, EntryType entryType,
            String amount, String balanceAfter, String description) {
        return new Transaction(1L, REFERENCE, 1L, accountNumber, type, entryType, new BigDecimal(amount),
                new BigDecimal(balanceAfter), description, NOW);
    }
}
