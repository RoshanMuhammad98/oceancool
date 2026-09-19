package com.oceancool.repository;

import com.oceancool.entity.Customer;
import com.oceancool.entity.PaymentStatus;
import com.oceancool.entity.ServiceRecord;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

/**
 * Filters for the service list. Criteria API rather than a JPQL query with
 * {@code :param is null} guards, so an unset filter needs no type coercion.
 */
public final class ServiceRecordSpecifications {

    private ServiceRecordSpecifications() {
    }

    public static Specification<ServiceRecord> customerIs(Long customerId) {
        if (customerId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("customer").get("id"), customerId);
    }

    public static Specification<ServiceRecord> statusIs(PaymentStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("paymentStatus"), status);
    }

    public static Specification<ServiceRecord> servicedFrom(LocalDate from) {
        if (from == null) {
            return null;
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("serviceDate"), from);
    }

    public static Specification<ServiceRecord> servicedTo(LocalDate to) {
        if (to == null) {
            return null;
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("serviceDate"), to);
    }

    /** Matches customer name, customer phone number, or service name. */
    public static Specification<ServiceRecord> matches(String term) {
        if (term == null || term.isBlank()) {
            return null;
        }
        String like = "%" + term.trim().toLowerCase() + "%";
        return (root, query, cb) -> {
            Join<ServiceRecord, Customer> customer = root.join("customer", JoinType.INNER);
            return cb.or(
                    cb.like(cb.lower(customer.get("name")), like),
                    cb.like(cb.lower(customer.get("phoneNumber")), like),
                    cb.like(cb.lower(root.get("serviceName")), like));
        };
    }
}
