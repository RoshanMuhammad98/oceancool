package com.oceancool.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.TimeZone;

/**
 * Pins the clock to the timezone the business actually works in.
 *
 * <p>Without this the JVM takes the host's zone, which inside a container is UTC. A shop
 * in India would then see the dashboard's "today" roll over at 05:30 local time: a job
 * logged at 1am would land on the previous day's figures, and "Today's services" would
 * be wrong for five and a half hours every night.
 *
 * <p>Setting the default here rather than threading a {@code Clock} through every
 * service fixes {@code LocalDate.now()} on the dashboard and reports, the dates the
 * forms default to, and the audit timestamps, all at once.
 *
 * <p>For a business somewhere else, set {@code APP_TIMEZONE} — {@code Europe/London},
 * {@code Asia/Dubai} — and nothing else has to change.
 */
@Configuration
public class BusinessTimeZoneConfig {

    private static final Logger log = LoggerFactory.getLogger(BusinessTimeZoneConfig.class);

    private final String zoneId;

    public BusinessTimeZoneConfig(@Value("${app.timezone}") String zoneId) {
        this.zoneId = zoneId;
    }

    @PostConstruct
    void applyTimeZone() {
        ZoneId zone = ZoneId.of(zoneId);
        TimeZone.setDefault(TimeZone.getTimeZone(zone));
        log.info("Business timezone is {} — today is {}", zone, LocalDate.now());
    }
}
