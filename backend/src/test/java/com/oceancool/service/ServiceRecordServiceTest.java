package com.oceancool.service;

import com.oceancool.dto.ServicePaymentRequest;
import com.oceancool.dto.ServiceRequest;
import com.oceancool.dto.ServiceResponse;
import com.oceancool.entity.Customer;
import com.oceancool.entity.PaymentStatus;
import com.oceancool.entity.ServiceRecord;
import com.oceancool.exception.BadRequestException;
import com.oceancool.repository.CustomerRepository;
import com.oceancool.repository.ServiceRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The payment-status rules (business rules 4-8) are the part of this app that must not
 * drift, so they are pinned here. No database involved.
 */
class ServiceRecordServiceTest {

    private static final LocalDate SERVICE_DATE = LocalDate.of(2026, 9, 10);

    private ServiceRecordRepository serviceRecords;
    private CustomerRepository customers;
    private ServiceRecordService service;
    private Customer abc;

    @BeforeEach
    void setUp() {
        serviceRecords = mock(ServiceRecordRepository.class);
        customers = mock(CustomerRepository.class);
        service = new ServiceRecordService(serviceRecords, customers);

        abc = new Customer();
        abc.setId(1L);
        abc.setName("ABC Company");
        abc.setPhoneNumber("9847112233");

        when(customers.findById(anyLong())).thenReturn(Optional.of(abc));
        // save() returns whatever it was handed, so assertions read the mapped response
        when(serviceRecords.save(any(ServiceRecord.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("PAID fills the paid amount and clears the pending amount")
    void paidCoversTheWholeAmount() {
        ServiceResponse response = service.create(
                request("AC Maintenance", "5000", PaymentStatus.PAID, null, SERVICE_DATE));

        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(response.paidAmount()).isEqualByComparingTo("5000.00");
        assertThat(response.pendingAmount()).isEqualByComparingTo("0.00");
        assertThat(response.paymentDate()).isEqualTo(SERVICE_DATE);
    }

    @Test
    @DisplayName("PENDING leaves nothing collected and no payment date")
    void pendingCollectsNothing() {
        ServiceResponse response = service.create(
                request("AC Gas Filling", "1800", PaymentStatus.PENDING, null, null));

        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(response.paidAmount()).isEqualByComparingTo("0.00");
        assertThat(response.pendingAmount()).isEqualByComparingTo("1800.00");
        assertThat(response.paymentDate()).isNull();
    }

    @Test
    @DisplayName("PARTIAL keeps the remaining amount correct")
    void partialLeavesTheRemainder() {
        ServiceResponse response = service.create(
                request("AC Repair", "3200", PaymentStatus.PARTIAL, "1500", SERVICE_DATE));

        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.PARTIAL);
        assertThat(response.paidAmount()).isEqualByComparingTo("1500.00");
        assertThat(response.pendingAmount()).isEqualByComparingTo("1700.00");
    }

    @Test
    @DisplayName("A partial payment equal to the full amount is not partial")
    void partialMustBeLessThanTheAmount() {
        assertThatThrownBy(() -> service.create(
                request("AC Service", "2500", PaymentStatus.PARTIAL, "2500", SERVICE_DATE)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("less than the full amount");
    }

    @Test
    @DisplayName("Collecting more than the service amount is refused")
    void overpaymentIsRefused() {
        ServiceRecord existing = existingRecord("2500", "0");
        when(serviceRecords.findById(7L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.recordPayment(7L,
                new ServicePaymentRequest(new BigDecimal("3000"), LocalDate.of(2026, 9, 25))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot be more than");
    }

    @Test
    @DisplayName("Collecting the balance later flips a pending record to PAID")
    void collectingLaterSettlesTheRecord() {
        ServiceRecord existing = existingRecord("5000", "0");
        when(serviceRecords.findById(7L)).thenReturn(Optional.of(existing));

        LocalDate collectedOn = LocalDate.of(2026, 9, 25);
        ServiceResponse response = service.recordPayment(7L,
                new ServicePaymentRequest(new BigDecimal("5000"), collectedOn));

        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(response.pendingAmount()).isEqualByComparingTo("0.00");
        assertThat(response.paymentDate()).isEqualTo(collectedOn);
    }

    @Test
    @DisplayName("Collecting part of the balance later flips a pending record to PARTIAL")
    void collectingPartLaterIsPartial() {
        ServiceRecord existing = existingRecord("5000", "0");
        when(serviceRecords.findById(7L)).thenReturn(Optional.of(existing));

        ServiceResponse response = service.recordPayment(7L,
                new ServicePaymentRequest(new BigDecimal("2000"), LocalDate.of(2026, 9, 25)));

        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.PARTIAL);
        assertThat(response.paidAmount()).isEqualByComparingTo("2000.00");
        assertThat(response.pendingAmount()).isEqualByComparingTo("3000.00");
    }

    /* ---------- helpers ---------- */

    private ServiceRequest request(String name,
                                   String amount,
                                   PaymentStatus status,
                                   String paidAmount,
                                   LocalDate paymentDate) {
        return new ServiceRequest(
                1L,
                name,
                new BigDecimal(amount),
                SERVICE_DATE,
                status,
                paidAmount == null ? null : new BigDecimal(paidAmount),
                paymentDate,
                null);
    }

    private ServiceRecord existingRecord(String amount, String paid) {
        ServiceRecord record = new ServiceRecord();
        record.setId(7L);
        record.setCustomer(abc);
        record.setServiceName("AC Maintenance");
        record.setAmount(new BigDecimal(amount).setScale(2, java.math.RoundingMode.HALF_UP));
        record.setPaidAmount(new BigDecimal(paid).setScale(2, java.math.RoundingMode.HALF_UP));
        record.setServiceDate(SERVICE_DATE);
        record.setPaymentStatus(PaymentStatus.PENDING);
        return record;
    }
}
