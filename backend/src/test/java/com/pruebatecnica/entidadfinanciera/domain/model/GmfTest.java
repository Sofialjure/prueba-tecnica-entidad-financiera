package com.pruebatecnica.entidadfinanciera.domain.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class GmfTest {

    @ParameterizedTest
    @CsvSource({
            "100000, 400.00",
            "200000, 800.00",
            "1000, 4.00",
            "1, 0.00",
            "1.25, 0.01",
            "12345.67, 49.38"
    })
    void chargesFourPerThousandRoundedToCents(String amount, String expected) {
        assertThat(Gmf.of(new BigDecimal(amount))).isEqualTo(new BigDecimal(expected));
    }
}
