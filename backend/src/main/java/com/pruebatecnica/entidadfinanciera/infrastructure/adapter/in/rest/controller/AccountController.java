package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.controller;

import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.domain.port.in.ChangeAccountStatusUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.GetAccountUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.OpenAccountUseCase;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.AccountRequest;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.AccountResponse;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.mapper.AccountRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Tag(name = "Cuentas", description = "Apertura, consulta y cambios de estado de cuentas de ahorros y corrientes")
@RestController
@RequestMapping("/api/v1")
public class AccountController {

    private final OpenAccountUseCase openAccount;
    private final GetAccountUseCase getAccount;
    private final ChangeAccountStatusUseCase changeAccountStatus;
    private final AccountRestMapper mapper;

    public AccountController(OpenAccountUseCase openAccount, GetAccountUseCase getAccount,
            ChangeAccountStatusUseCase changeAccountStatus, AccountRestMapper mapper) {
        this.openAccount = openAccount;
        this.getAccount = getAccount;
        this.changeAccountStatus = changeAccountStatus;
        this.mapper = mapper;
    }

    @Operation(summary = "Abrir cuenta",
            description = "Genera el número automáticamente (53 ahorros, 33 corriente). La cuenta nace activa con saldo $0")
    @PostMapping("/accounts")
    public ResponseEntity<AccountResponse> open(@Valid @RequestBody AccountRequest request) {
        Account account = openAccount.open(mapper.toData(request));
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(account.getId()).toUri();
        return ResponseEntity.created(location).body(mapper.toResponse(account));
    }

    @Operation(summary = "Listar cuentas")
    @GetMapping("/accounts")
    public List<AccountResponse> getAll() {
        return mapper.toResponses(getAccount.getAll());
    }

    @Operation(summary = "Consultar cuenta")
    @GetMapping("/accounts/{id}")
    public AccountResponse getById(@PathVariable Long id) {
        return mapper.toResponse(getAccount.getById(id));
    }

    @Operation(summary = "Cuentas de un cliente")
    @GetMapping("/customers/{customerId}/accounts")
    public List<AccountResponse> getByCustomerId(@PathVariable Long customerId) {
        return mapper.toResponses(getAccount.getByCustomerId(customerId));
    }

    @Operation(summary = "Activar cuenta", description = "Una cuenta cancelada no se puede reactivar")
    @PatchMapping("/accounts/{id}/activate")
    public AccountResponse activate(@PathVariable Long id) {
        return mapper.toResponse(changeAccountStatus.activate(id));
    }

    @Operation(summary = "Inactivar cuenta")
    @PatchMapping("/accounts/{id}/deactivate")
    public AccountResponse deactivate(@PathVariable Long id) {
        return mapper.toResponse(changeAccountStatus.deactivate(id));
    }

    @Operation(summary = "Cancelar cuenta", description = "Solo se puede cancelar con saldo $0. La cancelación es definitiva")
    @PatchMapping("/accounts/{id}/cancel")
    public AccountResponse cancel(@PathVariable Long id) {
        return mapper.toResponse(changeAccountStatus.cancel(id));
    }
}
