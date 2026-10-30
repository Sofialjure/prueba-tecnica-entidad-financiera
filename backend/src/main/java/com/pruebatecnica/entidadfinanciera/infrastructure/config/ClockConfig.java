package com.pruebatecnica.entidadfinanciera.infrastructure.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Single source of the current time, so dates and age checks are testable.
 */
@Configuration
public class ClockConfig {

    @Bean
    Clock clock(@Value("${app.time-zone:America/Bogota}") String timeZone) {
        return Clock.system(ZoneId.of(timeZone));
    }
}
