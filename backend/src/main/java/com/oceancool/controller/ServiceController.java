package com.oceancool.controller;

import com.oceancool.dto.ServicePaymentRequest;
import com.oceancool.dto.ServiceRequest;
import com.oceancool.dto.ServiceResponse;
import com.oceancool.entity.PaymentStatus;
import com.oceancool.service.ServiceRecordService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    private final ServiceRecordService serviceRecordService;

    public ServiceController(ServiceRecordService serviceRecordService) {
        this.serviceRecordService = serviceRecordService;
    }

    /**
     * The service list. Every filter is optional and they combine:
     * {@code ?from=2026-09-01&to=2026-09-30&status=PENDING&q=9847}
     *
     * @param q matches customer name, customer phone number or service name
     */
    @GetMapping
    public List<ServiceResponse> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String q) {
        return serviceRecordService.search(from, to, status, customerId, q);
    }

    @GetMapping("/{id}")
    public ServiceResponse get(@PathVariable Long id) {
        return serviceRecordService.get(id);
    }

    @PostMapping
    public ResponseEntity<ServiceResponse> create(@Valid @RequestBody ServiceRequest request) {
        ServiceResponse created = serviceRecordService.create(request);
        return ResponseEntity.created(URI.create("/api/services/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public ServiceResponse update(@PathVariable Long id,
                                  @Valid @RequestBody ServiceRequest request) {
        return serviceRecordService.update(id, request);
    }

    /**
     * Record money against a job billed earlier — the "serviced in September, paid in
     * October" case. Send the total received so far; the status follows.
     */
    @PatchMapping("/{id}/payment")
    public ServiceResponse recordPayment(@PathVariable Long id,
                                         @Valid @RequestBody ServicePaymentRequest request) {
        return serviceRecordService.recordPayment(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        serviceRecordService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
