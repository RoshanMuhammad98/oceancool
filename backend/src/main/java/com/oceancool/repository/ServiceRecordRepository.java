package com.oceancool.repository;

import com.oceancool.entity.ServiceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ServiceRecordRepository
        extends JpaRepository<ServiceRecord, Long>, JpaSpecificationExecutor<ServiceRecord> {

    List<ServiceRecord> findByCustomerIdOrderByServiceDateDescIdDesc(Long customerId);

    long countByCustomerId(Long customerId);

    long countByServiceDate(LocalDate serviceDate);

    List<ServiceRecord> findTop10ByOrderByServiceDateDescIdDesc();

    /* ---------- dashboard / report aggregates ---------- */

    @Query("select coalesce(sum(s.amount), 0) from ServiceRecord s where s.serviceDate between :from and :to")
    BigDecimal sumBilledBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    /**
     * Money received against jobs *dated* in the range — the same definition
     * {@code ReportService} uses, so "collected" means one thing across the whole app
     * and can never exceed what was billed for the same period.
     */
    @Query("select coalesce(sum(s.paidAmount), 0) from ServiceRecord s where s.serviceDate between :from and :to")
    BigDecimal sumCollectedBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("select coalesce(sum(s.amount - s.paidAmount), 0) from ServiceRecord s")
    BigDecimal sumPendingAll();

    /* ---------- per-customer rollups ---------- */

    @Query("""
            select s.customer.id as customerId,
                   count(s) as totalServices,
                   coalesce(sum(s.amount), 0) as totalAmount,
                   coalesce(sum(s.paidAmount), 0) as paidAmount
              from ServiceRecord s
             group by s.customer.id
            """)
    List<CustomerTotalsView> findTotalsGroupedByCustomer();

    @Query("""
            select s.customer.id as customerId,
                   count(s) as totalServices,
                   coalesce(sum(s.amount), 0) as totalAmount,
                   coalesce(sum(s.paidAmount), 0) as paidAmount
              from ServiceRecord s
             where s.customer.id = :customerId
             group by s.customer.id
            """)
    Optional<CustomerTotalsView> findTotalsByCustomerId(@Param("customerId") Long customerId);
}
