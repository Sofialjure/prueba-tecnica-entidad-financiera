package com.pruebatecnica.entidadfinanciera.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI openApi() {
        return new OpenAPI().info(new Info()
                .title("API Entidad Financiera")
                .description("Gestión de clientes, cuentas y transacciones de una entidad financiera")
                .version("v1")
                .contact(new Contact()
                        .name("Sofía Aljure")
                        .url("https://github.com/Sofialjure/prueba-tecnica-entidad-financiera")));
    }
}
