package com.oceancool.service;

import com.oceancool.dto.CustomerDetailResponse;
import com.oceancool.dto.CustomerRequest;
import com.oceancool.dto.CustomerResponse;
import com.oceancool.dto.ServiceResponse;
import com.oceancool.entity.Customer;
import com.oceancool.exception.BadRequestException;
import com.oceancool.exception.NotFoundException;
import com.oceancool.repository.CustomerRepository;
import com.oceancool.repository.CustomerTotalsView;
import com.oceancool.repository.ServiceRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private static final BigDecimal ZERO = Money.zero();

    private final CustomerRepository customerRepository;
    private final ServiceRecordRepository serviceRecordRepository;
    private final ServiceRecordService serviceRecordService;

    public CustomerService(CustomerRepository customerRepository,
                           ServiceRecordRepository serviceRecordRepository,
                           ServiceRecordService serviceRecordService) {
        this.customerRepository = customerRepository;
        this.serviceRecordRepository = serviceRecordRepository;
        this.serviceRecordService = serviceRecordService;
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> list(String search) {
        List<Customer> customers = (search == null || search.isBlank())
                ? customerRepository.findAllByOrderByNameAsc()
                : customerRepository.search(search.trim());

        // one aggregate query for every customer, instead of a query per row
        Map<Long, CustomerTotalsView> totals = serviceRecordRepository.findTotalsGroupedByCustomer()
                .stream()
                .collect(Collectors.toMap(CustomerTotalsView::getCustomerId, Function.identity(),
                        (a, b) -> a, HashMap::new));

        return customers.stream()
                .map(c -> toResponse(c, totals.get(c.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponse get(Long id) {
        Customer customer = require(id);
        return toResponse(customer, serviceRecordRepository.findTotalsByCustomerId(id).orElse(null));
    }

    @Transactional(readOnly = true)
    public CustomerDetailResponse detail(Long id) {
        Customer customer = require(id);
        List<ServiceResponse> history = serviceRecordRepository
                .findByCustomerIdOrderByServiceDateDescIdDesc(id)
                .stream()
                .map(serviceRecordService::toResponse)
                .toList();
        CustomerResponse header = toResponse(customer,
                serviceRecordRepository.findTotalsByCustomerId(id).orElse(null));
        return new CustomerDetailResponse(header, history);
    }

    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        Customer customer = new Customer();
        apply(customer, request);
        return toResponse(customerRepository.save(customer), null);
    }

    @Transactional
    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = require(id);
        apply(customer, request);
        Customer saved = customerRepository.save(customer);
        return toResponse(saved, serviceRecordRepository.findTotalsByCustomerId(id).orElse(null));
    }

    /**
     * Business rule 9 — a customer with history is not deletable by accident. The caller
     * has to ask for it explicitly with {@code force=true}, which then removes the
     * service records too.
     */
    @Transactional
    public void delete(Long id, boolean force) {
        Customer customer = require(id);
        long records = serviceRecordRepository.countByCustomerId(id);

        if (records > 0 && !force) {
            throw new BadRequestException(customer.getName() + " has " + records
                    + " service record" + (records == 1 ? "" : "s")
                    + ". Delete those first, or confirm deleting the history as well.");
        }
        if (records > 0) {
            serviceRecordRepository.deleteAll(
                    serviceRecordRepository.findByCustomerIdOrderByServiceDateDescIdDesc(id));
        }
        customerRepository.delete(customer);
    }

    private Customer require(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Customer", id));
    }

    private void apply(Customer customer, CustomerRequest request) {
        customer.setName(request.name().trim());
        customer.setPhoneNumber(blankToNull(request.phoneNumber()));
        customer.setAddress(blankToNull(request.address()));
    }

    private CustomerResponse toResponse(Customer customer, CustomerTotalsView totals) {
        long count = totals == null ? 0L : totals.getTotalServices();
        BigDecimal billed = Money.scale(totals == null ? ZERO : totals.getTotalAmount());
        BigDecimal paid = Money.scale(totals == null ? ZERO : totals.getPaidAmount());

        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getPhoneNumber(),
                customer.getAddress(),
                count,
                billed,
                paid,
                billed.subtract(paid),
                customer.getCreatedAt(),
                customer.getUpdatedAt());
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
