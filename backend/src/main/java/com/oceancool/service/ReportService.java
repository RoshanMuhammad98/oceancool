package com.oceancool.service;

import com.oceancool.dto.ReportGroup;
import com.oceancool.dto.ReportResponse;
import com.oceancool.entity.ServiceRecord;
import com.oceancool.exception.BadRequestException;
import com.oceancool.repository.ServiceRecordRepository;
import com.oceancool.repository.ServiceRecordSpecifications;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Revenue rolled up by day, week, month or year over any date range.
 *
 * <p>"Collected" is the money received against jobs <em>in the range</em> — the figure a
 * shop reads as "September brought in 65,000 of the 85,000 we billed". Buckets are
 * computed in Java so the report behaves identically on Postgres and on the H2 used in
 * tests.
 */
@Service
public class ReportService {

    private static final DateTimeFormatter DAY_LABEL =
            DateTimeFormatter.ofPattern("dd-MM-yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter MONTH_LABEL =
            DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);

    private final ServiceRecordRepository serviceRecordRepository;

    public ReportService(ServiceRecordRepository serviceRecordRepository) {
        this.serviceRecordRepository = serviceRecordRepository;
    }

    @Transactional(readOnly = true)
    public ReportResponse report(LocalDate from, LocalDate to, ReportGroup groupBy) {
        LocalDate today = LocalDate.now();
        LocalDate start = from != null ? from : today.withDayOfMonth(1);
        LocalDate end = to != null ? to : today.withDayOfMonth(today.lengthOfMonth());
        ReportGroup group = groupBy != null ? groupBy : ReportGroup.MONTH;

        if (start.isAfter(end)) {
            throw new BadRequestException("The 'from' date cannot be after the 'to' date");
        }

        Specification<ServiceRecord> spec = Specification.allOf(
                ServiceRecordSpecifications.servicedFrom(start),
                ServiceRecordSpecifications.servicedTo(end));

        List<ServiceRecord> records =
                serviceRecordRepository.findAll(spec, Sort.by(Sort.Order.asc("serviceDate")));

        BigDecimal totalAmount = Money.zero();
        BigDecimal totalCollected = Money.zero();
        Map<LocalDate, Accumulator> buckets = new LinkedHashMap<>();

        for (ServiceRecord record : records) {
            BigDecimal amount = Money.scale(record.getAmount());
            BigDecimal paid = Money.scale(record.getPaidAmount());
            totalAmount = Money.sum(totalAmount, amount);
            totalCollected = Money.sum(totalCollected, paid);

            LocalDate key = bucketStart(record.getServiceDate(), group);
            buckets.computeIfAbsent(key, k -> new Accumulator()).add(amount, paid);
        }

        List<ReportResponse.ReportBucket> rows = new ArrayList<>();
        buckets.forEach((key, acc) -> {
            LocalDate bucketEnd = bucketEnd(key, group);
            rows.add(new ReportResponse.ReportBucket(
                    label(key, group),
                    key,
                    // never advertise a bucket that runs past the filter
                    bucketEnd.isAfter(end) ? end : bucketEnd,
                    acc.services,
                    acc.amount,
                    acc.collected,
                    acc.amount.subtract(acc.collected)));
        });
        rows.sort(Comparator.comparing(ReportResponse.ReportBucket::from).reversed());

        return new ReportResponse(
                start,
                end,
                group.name(),
                records.size(),
                totalAmount,
                totalCollected,
                totalAmount.subtract(totalCollected),
                rows);
    }

    private LocalDate bucketStart(LocalDate date, ReportGroup group) {
        return switch (group) {
            case DAY -> date;
            case WEEK -> date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case MONTH -> date.withDayOfMonth(1);
            case YEAR -> date.withDayOfYear(1);
        };
    }

    private LocalDate bucketEnd(LocalDate start, ReportGroup group) {
        return switch (group) {
            case DAY -> start;
            case WEEK -> start.plusDays(6);
            case MONTH -> start.withDayOfMonth(start.lengthOfMonth());
            case YEAR -> start.withDayOfYear(start.lengthOfYear());
        };
    }

    private String label(LocalDate start, ReportGroup group) {
        return switch (group) {
            case DAY -> DAY_LABEL.format(start);
            case WEEK -> "Week of " + DAY_LABEL.format(start);
            case MONTH -> MONTH_LABEL.format(start);
            case YEAR -> String.valueOf(start.getYear());
        };
    }

    /** Mutable tally for one bucket while the records are being walked. */
    private static final class Accumulator {
        private long services;
        private BigDecimal amount = Money.zero();
        private BigDecimal collected = Money.zero();

        void add(BigDecimal billed, BigDecimal paid) {
            services++;
            amount = Money.sum(amount, billed);
            collected = Money.sum(collected, paid);
        }
    }
}
