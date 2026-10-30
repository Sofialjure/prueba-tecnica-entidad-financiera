package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.controller;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pruebatecnica.entidadfinanciera.domain.exception.BusinessRuleViolationException;
import com.pruebatecnica.entidadfinanciera.domain.exception.ResourceConflictException;
import com.pruebatecnica.entidadfinanciera.domain.exception.ResourceNotFoundException;
import com.pruebatecnica.entidadfinanciera.domain.model.Customer;
import com.pruebatecnica.entidadfinanciera.domain.model.CustomerData;
import com.pruebatecnica.entidadfinanciera.domain.model.IdentificationType;
import com.pruebatecnica.entidadfinanciera.domain.port.in.CreateCustomerUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.DeleteCustomerUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.GetCustomerUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.UpdateCustomerUseCase;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.mapper.CustomerRestMapperImpl;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CustomerController.class)
@Import(CustomerRestMapperImpl.class)
class CustomerControllerTest {

    private static final String VALID_REQUEST = """
            {
              "identificationType": "CC",
              "identificationNumber": "1020304050",
              "firstName": "Ana María",
              "lastName": "Gómez",
              "email": "ana.gomez@correo.com",
              "birthDate": "1995-04-12"
            }
            """;

    private static final CustomerData VALID_DATA = new CustomerData(IdentificationType.CC, "1020304050",
            "Ana María", "Gómez", "ana.gomez@correo.com", LocalDate.of(1995, 4, 12));

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreateCustomerUseCase createCustomer;
    @MockitoBean
    private GetCustomerUseCase getCustomer;
    @MockitoBean
    private UpdateCustomerUseCase updateCustomer;
    @MockitoBean
    private DeleteCustomerUseCase deleteCustomer;

    @Test
    void createReturns201WithLocationAndBody() throws Exception {
        when(createCustomer.create(VALID_DATA)).thenReturn(customer(1L));

        mockMvc.perform(post("/api/v1/customers").contentType(MediaType.APPLICATION_JSON).content(VALID_REQUEST))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/v1/customers/1"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.identificationType").value("CC"))
                .andExpect(jsonPath("$.firstName").value("Ana María"))
                .andExpect(jsonPath("$.birthDate").value("1995-04-12"))
                .andExpect(jsonPath("$.createdAt").value("2026-10-30T10:00:00"))
                .andExpect(jsonPath("$.updatedAt").value("2026-10-30T10:00:00"));
    }

    @Test
    void createReturns400WhenFieldsAreInvalid() throws Exception {
        String invalid = """
                {
                  "identificationType": "CC",
                  "identificationNumber": "",
                  "firstName": "A",
                  "lastName": "Gómez",
                  "email": "ana@correo",
                  "birthDate": null
                }
                """;

        mockMvc.perform(post("/api/v1/customers").contentType(MediaType.APPLICATION_JSON).content(invalid))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Datos de entrada inválidos"))
                .andExpect(jsonPath("$.errors[*].field", hasItem("identificationNumber")))
                .andExpect(jsonPath("$.errors[*].field", hasItem("firstName")))
                .andExpect(jsonPath("$.errors[*].field", hasItem("email")))
                .andExpect(jsonPath("$.errors[*].field", hasItem("birthDate")))
                .andExpect(jsonPath("$.errors[*].message",
                        hasItem("El correo electrónico debe tener el formato xxxx@xxxxx.xxx")));
        verifyNoInteractions(createCustomer);
    }

    @Test
    void createReturns400WhenIdentificationTypeIsUnknown() throws Exception {
        String invalid = VALID_REQUEST.replace("\"CC\"", "\"TI\"");

        mockMvc.perform(post("/api/v1/customers").contentType(MediaType.APPLICATION_JSON).content(invalid))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Datos de entrada inválidos"));
        verifyNoInteractions(createCustomer);
    }

    @Test
    void createReturns422WhenCustomerIsUnderage() throws Exception {
        when(createCustomer.create(any())).thenThrow(
                new BusinessRuleViolationException("El cliente debe ser mayor de edad (18 años cumplidos)"));

        mockMvc.perform(post("/api/v1/customers").contentType(MediaType.APPLICATION_JSON).content(VALID_REQUEST))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value("El cliente debe ser mayor de edad (18 años cumplidos)"));
    }

    @Test
    void createReturns409WhenIdentificationAlreadyExists() throws Exception {
        when(createCustomer.create(any())).thenThrow(
                new ResourceConflictException("Ya existe un cliente con identificación CC 1020304050"));

        mockMvc.perform(post("/api/v1/customers").contentType(MediaType.APPLICATION_JSON).content(VALID_REQUEST))
                .andExpect(status().isConflict());
    }

    @Test
    void getAllReturnsCustomers() throws Exception {
        when(getCustomer.getAll()).thenReturn(List.of(customer(1L), customer(2L)));

        mockMvc.perform(get("/api/v1/customers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    void getByIdReturnsCustomer() throws Exception {
        when(getCustomer.getById(1L)).thenReturn(customer(1L));

        mockMvc.perform(get("/api/v1/customers/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ana.gomez@correo.com"));
    }

    @Test
    void getByIdReturns404WhenCustomerDoesNotExist() throws Exception {
        when(getCustomer.getById(99L)).thenThrow(new ResourceNotFoundException("No existe el cliente con id 99"));

        mockMvc.perform(get("/api/v1/customers/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("No existe el cliente con id 99"));
    }

    @Test
    void getByIdReturns400WhenIdIsNotANumber() throws Exception {
        mockMvc.perform(get("/api/v1/customers/abc"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateReturnsUpdatedCustomer() throws Exception {
        when(updateCustomer.update(eq(1L), eq(VALID_DATA))).thenReturn(customer(1L));

        mockMvc.perform(put("/api/v1/customers/1").contentType(MediaType.APPLICATION_JSON).content(VALID_REQUEST))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void updateReturns400WhenFieldsAreInvalid() throws Exception {
        String invalid = VALID_REQUEST.replace("ana.gomez@correo.com", "no-es-correo");

        mockMvc.perform(put("/api/v1/customers/1").contentType(MediaType.APPLICATION_JSON).content(invalid))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(updateCustomer);
    }

    @Test
    void deleteReturns204() throws Exception {
        mockMvc.perform(delete("/api/v1/customers/1"))
                .andExpect(status().isNoContent());
        verify(deleteCustomer).delete(1L);
    }

    @Test
    void deleteReturns409WhenCustomerHasAccounts() throws Exception {
        doThrow(new ResourceConflictException("El cliente con id 1 tiene productos vinculados y no se puede eliminar"))
                .when(deleteCustomer).delete(1L);

        mockMvc.perform(delete("/api/v1/customers/1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("El cliente con id 1 tiene productos vinculados y no se puede eliminar"));
    }

    private static Customer customer(Long id) {
        LocalDateTime now = LocalDateTime.of(2026, 10, 30, 10, 0);
        return Customer.builder()
                .id(id)
                .identificationType(IdentificationType.CC)
                .identificationNumber("1020304050")
                .firstName("Ana María")
                .lastName("Gómez")
                .email("ana.gomez@correo.com")
                .birthDate(LocalDate.of(1995, 4, 12))
                .createdAt(now)
                .updatedAt(now)
                .build();
    }
}
