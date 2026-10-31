package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.controller;

import com.pruebatecnica.entidadfinanciera.domain.model.Customer;
import com.pruebatecnica.entidadfinanciera.domain.port.in.CreateCustomerUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.DeleteCustomerUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.GetCustomerUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.UpdateCustomerUseCase;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.CustomerRequest;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.CustomerResponse;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.mapper.CustomerRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Tag(name = "Clientes", description = "Registro, consulta, actualización y eliminación de clientes")
@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    private final CreateCustomerUseCase createCustomer;
    private final GetCustomerUseCase getCustomer;
    private final UpdateCustomerUseCase updateCustomer;
    private final DeleteCustomerUseCase deleteCustomer;
    private final CustomerRestMapper mapper;

    public CustomerController(CreateCustomerUseCase createCustomer, GetCustomerUseCase getCustomer,
            UpdateCustomerUseCase updateCustomer, DeleteCustomerUseCase deleteCustomer, CustomerRestMapper mapper) {
        this.createCustomer = createCustomer;
        this.getCustomer = getCustomer;
        this.updateCustomer = updateCustomer;
        this.deleteCustomer = deleteCustomer;
        this.mapper = mapper;
    }

    @Operation(summary = "Crear cliente", description = "El cliente debe ser mayor de edad y su identificación única")
    @PostMapping
    public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CustomerRequest request) {
        Customer customer = createCustomer.create(mapper.toData(request));
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(customer.getId()).toUri();
        return ResponseEntity.created(location).body(mapper.toResponse(customer));
    }

    @Operation(summary = "Listar clientes")
    @GetMapping
    public List<CustomerResponse> getAll() {
        return mapper.toResponses(getCustomer.getAll());
    }

    @Operation(summary = "Consultar cliente")
    @GetMapping("/{id}")
    public CustomerResponse getById(@PathVariable Long id) {
        return mapper.toResponse(getCustomer.getById(id));
    }

    @Operation(summary = "Actualizar cliente", description = "La fecha de modificación se calcula automáticamente")
    @PutMapping("/{id}")
    public CustomerResponse update(@PathVariable Long id, @Valid @RequestBody CustomerRequest request) {
        return mapper.toResponse(updateCustomer.update(id, mapper.toData(request)));
    }

    @Operation(summary = "Eliminar cliente", description = "No se puede eliminar un cliente con productos vinculados")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deleteCustomer.delete(id);
        return ResponseEntity.noContent().build();
    }
}
