package com.oceancool.config;

import com.oceancool.entity.Customer;
import com.oceancool.entity.PaymentStatus;
import com.oceancool.entity.ServiceRecord;
import com.oceancool.entity.User;
import com.oceancool.repository.CustomerRepository;
import com.oceancool.repository.ServiceRecordRepository;
import com.oceancool.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Makes a fresh database usable: one staff login, and — while
 * {@code app.seed-demo} is true — a handful of records so the dashboard and reports
 * have something to show on first run. Set {@code app.seed-demo=false} before handing
 * the app to the shop.
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final ServiceRecordRepository serviceRecordRepository;
    private final PasswordEncoder passwordEncoder;

    private final String adminUsername;
    private final String adminPassword;
    private final boolean seedDemo;

    public DataSeeder(UserRepository userRepository,
                      CustomerRepository customerRepository,
                      ServiceRecordRepository serviceRecordRepository,
                      PasswordEncoder passwordEncoder,
                      @Value("${app.admin.username}") String adminUsername,
                      @Value("${app.admin.password}") String adminPassword,
                      @Value("${app.seed-demo}") boolean seedDemo) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.serviceRecordRepository = serviceRecordRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.seedDemo = seedDemo;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedStaffLogin();
        if (seedDemo) {
            seedDemoRecords();
        }
    }

    private void seedStaffLogin() {
        if (userRepository.existsByUsernameIgnoreCase(adminUsername)) {
            return;
        }
        userRepository.save(new User(
                adminUsername,
                passwordEncoder.encode(adminPassword),
                "OceanCool Office"));
        log.info("Created the first staff login '{}'. Change the password in application.properties.",
                adminUsername);
    }

    private void seedDemoRecords() {
        if (customerRepository.count() > 0) {
            return;
        }
        LocalDate today = LocalDate.now();

        Customer abc = customer("ABC Company", "9847112233",
                "2nd Floor, Marine Drive, Kochi");
        Customer xyz = customer("XYZ Traders", "9995440011",
                "Bypass Junction, Edappally");
        Customer sreela = customer("Sreela Menon", "9846778899",
                "Kakkanad, Ernakulam");
        Customer lulu = customer("Grand Plaza Hotel", "9847556677",
                "MG Road, Kochi");

        // today — what the dashboard opens on
        service(abc, "AC Service", "2500", today, PaymentStatus.PAID, null, today);
        service(xyz, "AC Gas Filling", "1800", today, PaymentStatus.PENDING, null, null);

        // earlier this month — a partial, the case the status rules exist for
        service(sreela, "AC Repair", "3200", today.minusDays(6),
                PaymentStatus.PARTIAL, "1500", today.minusDays(2));
        service(lulu, "AC Maintenance", "12000", today.minusDays(11),
                PaymentStatus.PAID, null, today.minusDays(4));
        service(abc, "AC Cleaning", "1400", today.minusDays(13),
                PaymentStatus.PENDING, null, null);

        // last month, collected late — the "service now, cash next month" case
        service(lulu, "AC Installation", "26000", today.minusMonths(1).withDayOfMonth(10),
                PaymentStatus.PAID, null, today.minusDays(9));
        service(xyz, "Compressor Repair", "8500", today.minusMonths(1).withDayOfMonth(18),
                PaymentStatus.PENDING, null, null);

        // a year-old AMC, still open — shows up in Pending and in the yearly report
        service(abc, "AC Inspection", "900", today.minusYears(1).withDayOfMonth(5),
                PaymentStatus.PENDING, null, null);

        log.info("Seeded {} demo customers and {} demo service records.",
                customerRepository.count(), serviceRecordRepository.count());
    }

    private Customer customer(String name, String phone, String address) {
        Customer c = new Customer();
        c.setName(name);
        c.setPhoneNumber(phone);
        c.setAddress(address);
        return customerRepository.save(c);
    }

    private void service(Customer customer,
                         String name,
                         String amount,
                         LocalDate serviceDate,
                         PaymentStatus status,
                         String paidAmount,
                         LocalDate paymentDate) {
        BigDecimal billed = new BigDecimal(amount).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal paid = switch (status) {
            case PAID -> billed;
            case PENDING -> BigDecimal.ZERO.setScale(2, java.math.RoundingMode.HALF_UP);
            case PARTIAL -> new BigDecimal(paidAmount).setScale(2, java.math.RoundingMode.HALF_UP);
        };

        ServiceRecord record = new ServiceRecord();
        record.setCustomer(customer);
        record.setServiceName(name);
        record.setAmount(billed);
        record.setPaidAmount(paid);
        record.setServiceDate(serviceDate);
        record.setPaymentStatus(status);
        record.setPaymentDate(paid.signum() == 0 ? null : (paymentDate != null ? paymentDate : serviceDate));
        serviceRecordRepository.save(record);
    }
}
