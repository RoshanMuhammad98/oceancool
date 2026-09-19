package com.oceancool.service;

import com.oceancool.dto.ServicePaymentRequest;
import com.oceancool.dto.ServiceRequest;
import com.oceancool.dto.ServiceResponse;
import com.oceancool.entity.Customer;
import com.oceancool.entity.PaymentStatus;
import com.oceancool.entity.ServiceRecord;
import com.oceancool.exception.BadRequestException;
import com.oceancool.exception.NotFoundException;
import com.oceancool.repository.CustomerRepository;
import com.oceancool.repository.ServiceRecordRepository;
import com.oceancool.repository.ServiceRecordSpecifications;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class ServiceRecordService {

    private static final Sort NEWEST_FIRST =
            Sort.by(Sort.Order.desc("serviceDate"), Sort.Order.desc("id"));

    private final ServiceRecordRepository serviceRecordRepository;
    private final CustomerRepository customerRepository;

    public ServiceRecordService(ServiceRecordRepository serviceRecordRepository,
                                CustomerRepository customerRepository) {
        this.serviceRecordRepository = serviceRecordRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<ServiceResponse> search(LocalDate from,
                                        LocalDate to,
                                        PaymentStatus status,
                                        Long customerId,
                                        String term) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("The 'from' date cannot be after the 'to' date");
        }

        Specification<ServiceRecord> spec = Specification
                .allOf(ServiceRecordSpecifications.servicedFrom(from),
                        ServiceRecordSpecifications.servicedTo(to),
                        ServiceRecordSpecifications.statusIs(status),
                        ServiceRecordSpecifications.customerIs(customerId),
                        ServiceRecordSpecifications.matches(term));

        return serviceRecordRepository.findAll(spec, NEWEST_FIRST).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceResponse get(Long id) {
        return toResponse(require(id));
    }

    @Transactional
    public ServiceResponse create(ServiceRequest request) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> NotFoundException.of("Customer", request.customerId()));

        ServiceRecord record = new ServiceRecord();
        record.setCustomer(customer);
        applyDetails(record, request);
        applyMoney(record, request.paymentStatus(), request.paidAmount(), request.paymentDate());

        return toResponse(serviceRecordRepository.save(record));
    }

    @Transactional
    public ServiceResponse update(Long id, ServiceRequest request) {
        ServiceRecord record = require(id);

        if (!record.getCustomer().getId().equals(request.customerId())) {
            Customer customer = customerRepository.findById(request.customerId())
                    .orElseThrow(() -> NotFoundException.of("Customer", request.customerId()));
            record.setCustomer(customer);
        }

        applyDetails(record, request);
        applyMoney(record, request.paymentStatus(), request.paidAmount(), request.paymentDate());

        return toResponse(serviceRecordRepository.save(record));
    }

    /**
     * Recording money for a job that was billed earlier. {@code paidAmount} is the total
     * received so far for the record, so the status follows automatically.
     */
    @Transactional
    public ServiceResponse recordPayment(Long id, ServicePaymentRequest request) {
        ServiceRecord record = require(id);
        applyMoney(record, null, request.paidAmount(), request.paymentDate());
        return toResponse(serviceRecordRepository.save(record));
    }

    @Transactional
    public void delete(Long id) {
        serviceRecordRepository.delete(require(id));
    }

    /* ------------------------------------------------------------------ */

    private ServiceRecord require(Long id) {
        return serviceRecordRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Service record", id));
    }

    private void applyDetails(ServiceRecord record, ServiceRequest request) {
        record.setServiceName(request.serviceName().trim());
        record.setAmount(Money.scale(request.amount()));
        record.setServiceDate(request.serviceDate());
        record.setRemarks(request.remarks() == null || request.remarks().isBlank()
                ? null : request.remarks().trim());
    }

    /**
     * The one place payment status is decided (business rules 4-8).
     *
     * <p>{@code requestedStatus} is the staff member's intent: PAID means the whole
     * amount, PENDING means nothing yet, PARTIAL means "this much so far" and needs
     * {@code paidAmount}. Pass null to keep the amount as given — used when only the
     * money is being updated. Whatever comes in, the stored status is then recomputed
     * from the figures, so the two can never disagree.
     */
    private void applyMoney(ServiceRecord record,
                            PaymentStatus requestedStatus,
                            BigDecimal paidAmount,
                            LocalDate paymentDate) {
        BigDecimal amount = Money.scale(record.getAmount());
        BigDecimal paid;

        if (requestedStatus == PaymentStatus.PAID) {
            paid = amount;
        } else if (requestedStatus == PaymentStatus.PENDING) {
            paid = Money.zero();
        } else {
            // PARTIAL, or a payment-only update
            if (paidAmount == null) {
                throw new BadRequestException("Enter how much has been received");
            }
            paid = Money.scale(paidAmount);
        }

        if (Money.isNegative(paid)) {
            throw new BadRequestException("Paid amount cannot be negative");
        }
        // business rule 8
        if (paid.compareTo(amount) > 0) {
            throw new BadRequestException("Paid amount cannot be more than the service amount");
        }
        if (requestedStatus == PaymentStatus.PARTIAL
                && (Money.isZero(paid) || paid.compareTo(amount) == 0)) {
            throw new BadRequestException(
                    "A partial payment must be more than zero and less than the full amount");
        }

        record.setPaidAmount(paid);
        record.setPaymentStatus(deriveStatus(amount, paid));
        record.setPaymentDate(Money.isZero(paid)
                ? null
                : (paymentDate != null ? paymentDate : record.getServiceDate()));
    }

    /** Business rules 5-7. */
    private PaymentStatus deriveStatus(BigDecimal amount, BigDecimal paid) {
        if (Money.isZero(paid)) {
            return PaymentStatus.PENDING;
        }
        return paid.compareTo(amount) >= 0 ? PaymentStatus.PAID : PaymentStatus.PARTIAL;
    }

    ServiceResponse toResponse(ServiceRecord record) {
        Customer customer = record.getCustomer();
        BigDecimal amount = Money.scale(record.getAmount());
        BigDecimal paid = Money.scale(record.getPaidAmount());

        return new ServiceResponse(
                record.getId(),
                customer.getId(),
                customer.getName(),
                customer.getPhoneNumber(),
                record.getServiceName(),
                amount,
                paid,
                amount.subtract(paid),
                record.getServiceDate(),
                record.getPaymentStatus(),
                record.getPaymentDate(),
                record.getRemarks(),
                record.getCreatedAt(),
                record.getUpdatedAt());
    }
}
