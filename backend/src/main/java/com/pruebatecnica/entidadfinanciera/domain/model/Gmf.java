package com.pruebatecnica.entidadfinanciera.domain.model;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Colombian financial transactions tax (GMF): 4 pesos per 1,000 debited (SUP-10).
 */
public final class Gmf {

    public static final BigDecimal RATE = new BigDecimal("0.004");
    public static final String DESCRIPTION = "GMF 4x1000";

    private Gmf() {
    }

    public static BigDecimal of(BigDecimal amount) {
        return amount.multiply(RATE).setScale(Account.MONEY_SCALE, RoundingMode.HALF_UP);
    }
}
