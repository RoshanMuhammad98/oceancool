package com.oceancool.service;

import com.oceancool.dto.DashboardResponse;
import com.oceancool.dto.ServiceResponse;
import com.oceancool.repository.CustomerRepository;
import com.oceancool.repository.ServiceRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class DashboardService {

    private final ServiceRecordRepository serviceRecordRepository;
    private final CustomerRepository customerRepository;
    private final ServiceRecordService serviceRecordService;

    public DashboardService(ServiceRecordRepository serviceRecordRepository,
                            CustomerRepository customerRepository,
                            ServiceRecordService serviceRecordService) {
        this.serviceRecordRepository = serviceRecordRepository;
        this.customerRepository = customerRepository;
        this.serviceRecordService = serviceRecordService;
    }

    @Transactional(readOnly = true)
    public DashboardResponse summary() {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

        List<ServiceResponse> recent = serviceRecordRepository
                .findTop10ByOrderByServiceDateDescIdDesc()
                .stream()
                .map(serviceRecordService::toResponse)
                .toList();

        return new DashboardResponse(
                serviceRecordRepository.countByServiceDate(today),
                Money.scale(serviceRecordRepository.sumBilledBetween(today, today)),
                Money.scale(serviceRecordRepository.sumCollectedBetween(today, today)),
                Money.scale(serviceRecordRepository.sumBilledBetween(monthStart, monthEnd)),
                Money.scale(serviceRecordRepository.sumCollectedBetween(monthStart, monthEnd)),
                Money.scale(serviceRecordRepository.sumPendingAll()),
                customerRepository.count(),
                recent);
    }
}
