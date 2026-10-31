package com.pruebatecnica.entidadfinanciera.application.service;

import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.domain.model.OpenAccountData;
import com.pruebatecnica.entidadfinanciera.domain.port.out.AccountNumberSequencePort;
import java.time.Clock;
import org.springframework.stereotype.Component;

/**
 * Builds new accounts with their automatic 10-digit number: the type prefix followed by
 * an 8-digit consecutive, e.g. 5300000001 or 3300000001 (RF-12).
 */
@Component
public class AccountFactory {

    private static final String CONSECUTIVE_FORMAT = "%08d";

    private final AccountNumberSequencePort numberSequence;
    private final Clock clock;

    public AccountFactory(AccountNumberSequencePort numberSequence, Clock clock) {
        this.numberSequence = numberSequence;
        this.clock = clock;
    }

    public Account open(OpenAccountData data) {
        String accountNumber = data.accountType().policy().numberPrefix()
                + String.format(CONSECUTIVE_FORMAT, numberSequence.nextValue(data.accountType()));
        return Account.open(data, accountNumber, clock);
    }
}
