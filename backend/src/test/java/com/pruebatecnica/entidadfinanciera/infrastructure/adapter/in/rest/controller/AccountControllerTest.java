package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.controller;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pruebatecnica.entidadfinanciera.domain.exception.BusinessRuleViolationException;
import com.pruebatecnica.entidadfinanciera.domain.exception.ResourceNotFoundException;
import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountStatus;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountType;
import com.pruebatecnica.entidadfinanciera.domain.model.OpenAccountData;
import com.pruebatecnica.entidadfinanciera.domain.port.in.ChangeAccountStatusUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.GetAccountUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.OpenAccountUseCase;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.mapper.AccountRestMapperImpl;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AccountController.class)
@Import(AccountRestMapperImpl.class)
class AccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OpenAccountUseCase openAccount;
    @MockitoBean
    private GetAccountUseCase getAccount;
    @MockitoBean
    private ChangeAccountStatusUseCase changeAccountStatus;

    @Test
    void openReturns201WithLocationAndBody() throws Exception {
        when(openAccount.open(new OpenAccountData(1L, AccountType.CHECKING, new BigDecimal("500000"), true)))
                .thenReturn(account(1L, AccountType.CHECKING, "3300000003", AccountStatus.ACTIVE, "0.00", "500000.00"));

        mockMvc.perform(post("/api/v1/accounts").contentType(MediaType.APPLICATION_JSON).content("""
                        {"customerId": 1, "accountType": "CHECKING", "overdraftLimit": 500000, "gmfExempt": true}
                        """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/v1/accounts/1"))
                .andExpect(jsonPath("$.accountNumber").value("3300000003"))
                .andExpect(jsonPath("$.accountType").value("CHECKING"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.balance").value(0))
                .andExpect(jsonPath("$.overdraftLimit").value(500000))
                .andExpect(jsonPath("$.availableBalance").value(500000))
                .andExpect(jsonPath("$.gmfExempt").value(true))
                .andExpect(jsonPath("$.customerId").value(1))
                .andExpect(jsonPath("$.createdAt").value("2026-10-30T10:00:00"));
    }

    @Test
    void openDefaultsOptionalFields() throws Exception {
        when(openAccount.open(new OpenAccountData(1L, AccountType.SAVINGS, null, false)))
                .thenReturn(account(1L, AccountType.SAVINGS, "5300000003", AccountStatus.ACTIVE, "0.00", "0.00"));

        mockMvc.perform(post("/api/v1/accounts").contentType(MediaType.APPLICATION_JSON).content("""
                        {"customerId": 1, "accountType": "SAVINGS"}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.gmfExempt").value(false));
    }

    @Test
    void openReturns400WhenFieldsAreInvalid() throws Exception {
        mockMvc.perform(post("/api/v1/accounts").contentType(MediaType.APPLICATION_JSON).content("""
                        {"customerId": null, "accountType": null, "overdraftLimit": -1}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Datos de entrada inválidos"))
                .andExpect(jsonPath("$.errors[*].field", hasItem("customerId")))
                .andExpect(jsonPath("$.errors[*].field", hasItem("accountType")))
                .andExpect(jsonPath("$.errors[*].message", hasItem("El cupo de sobregiro no puede ser negativo")));
        verifyNoInteractions(openAccount);
    }

    @Test
    void openReturns400WhenAccountTypeIsUnknown() throws Exception {
        mockMvc.perform(post("/api/v1/accounts").contentType(MediaType.APPLICATION_JSON).content("""
                        {"customerId": 1, "accountType": "CDT"}
                        """))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(openAccount);
    }

    @Test
    void openReturns404WhenCustomerDoesNotExist() throws Exception {
        when(openAccount.open(any())).thenThrow(new ResourceNotFoundException("No existe el cliente con id 99"));

        mockMvc.perform(post("/api/v1/accounts").contentType(MediaType.APPLICATION_JSON).content("""
                        {"customerId": 99, "accountType": "SAVINGS"}
                        """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("No existe el cliente con id 99"));
    }

    @Test
    void openReturns422WhenSavingsAccountHasOverdraft() throws Exception {
        when(openAccount.open(any()))
                .thenThrow(new BusinessRuleViolationException("La cuenta de ahorros no admite cupo de sobregiro"));

        mockMvc.perform(post("/api/v1/accounts").contentType(MediaType.APPLICATION_JSON).content("""
                        {"customerId": 1, "accountType": "SAVINGS", "overdraftLimit": 1000}
                        """))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value("La cuenta de ahorros no admite cupo de sobregiro"));
    }

    @Test
    void getAllReturnsAccounts() throws Exception {
        when(getAccount.getAll()).thenReturn(List.of(
                account(1L, AccountType.SAVINGS, "5300000001", AccountStatus.ACTIVE, "1799200.00", "0.00"),
                account(2L, AccountType.CHECKING, "3300000001", AccountStatus.ACTIVE, "899600.00", "500000.00")));

        mockMvc.perform(get("/api/v1/accounts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].availableBalance").value(1399600));
    }

    @Test
    void getByIdReturnsAccount() throws Exception {
        when(getAccount.getById(1L))
                .thenReturn(account(1L, AccountType.SAVINGS, "5300000001", AccountStatus.ACTIVE, "1799200.00", "0.00"));

        mockMvc.perform(get("/api/v1/accounts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(1799200));
    }

    @Test
    void getByIdReturns404WhenAccountDoesNotExist() throws Exception {
        when(getAccount.getById(99L)).thenThrow(new ResourceNotFoundException("No existe la cuenta con id 99"));

        mockMvc.perform(get("/api/v1/accounts/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getByCustomerIdReturnsCustomerAccounts() throws Exception {
        when(getAccount.getByCustomerId(1L)).thenReturn(List.of(
                account(1L, AccountType.SAVINGS, "5300000001", AccountStatus.ACTIVE, "1799200.00", "0.00")));

        mockMvc.perform(get("/api/v1/customers/1/accounts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].accountNumber").value("5300000001"));
    }

    @Test
    void activateReturnsActiveAccount() throws Exception {
        when(changeAccountStatus.activate(1L))
                .thenReturn(account(1L, AccountType.SAVINGS, "5300000001", AccountStatus.ACTIVE, "0.00", "0.00"));

        mockMvc.perform(patch("/api/v1/accounts/1/activate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void activateReturns422WhenAccountIsCancelled() throws Exception {
        when(changeAccountStatus.activate(1L)).thenThrow(new BusinessRuleViolationException(
                "La cuenta 5300000001 está cancelada y no se puede reactivar"));

        mockMvc.perform(patch("/api/v1/accounts/1/activate"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value("La cuenta 5300000001 está cancelada y no se puede reactivar"));
    }

    @Test
    void deactivateReturnsInactiveAccount() throws Exception {
        when(changeAccountStatus.deactivate(1L))
                .thenReturn(account(1L, AccountType.SAVINGS, "5300000001", AccountStatus.INACTIVE, "0.00", "0.00"));

        mockMvc.perform(patch("/api/v1/accounts/1/deactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    @Test
    void cancelReturnsCancelledAccount() throws Exception {
        when(changeAccountStatus.cancel(1L))
                .thenReturn(account(1L, AccountType.SAVINGS, "5300000001", AccountStatus.CANCELLED, "0.00", "0.00"));

        mockMvc.perform(patch("/api/v1/accounts/1/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void cancelReturns422WhenBalanceIsNotZero() throws Exception {
        when(changeAccountStatus.cancel(1L)).thenThrow(new BusinessRuleViolationException(
                "La cuenta 5300000001 solo se puede cancelar con saldo $0 (saldo actual: 1799200.00)"));

        mockMvc.perform(patch("/api/v1/accounts/1/cancel"))
                .andExpect(status().isUnprocessableContent());
    }

    private static Account account(Long id, AccountType type, String number, AccountStatus status,
            String balance, String overdraftLimit) {
        LocalDateTime now = LocalDateTime.of(2026, 10, 30, 10, 0);
        return Account.builder()
                .id(id)
                .accountType(type)
                .accountNumber(number)
                .status(status)
                .balance(new BigDecimal(balance))
                .overdraftLimit(new BigDecimal(overdraftLimit))
                .gmfExempt(type == AccountType.CHECKING)
                .customerId(1L)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }
}
