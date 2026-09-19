package com.oceancool.controller;

import com.oceancool.dto.ReportGroup;
import com.oceancool.dto.ReportResponse;
import com.oceancool.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * Revenue report. Defaults to the current month grouped by MONTH.
     * {@code ?from=2026-01-01&to=2026-12-31&groupBy=MONTH}
     */
    @GetMapping
    public ReportResponse report(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) ReportGroup groupBy) {
        return reportService.report(from, to, groupBy);
    }
}
