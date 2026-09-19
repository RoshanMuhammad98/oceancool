package com.oceancool.repository;

import com.oceancool.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<Customer> findAllByOrderByNameAsc();

    /** Search by name or phone number. Callers pass a trimmed, non-empty term. */
    @Query("""
            select c from Customer c
             where lower(c.name) like lower(concat('%', :term, '%'))
                or c.phoneNumber like concat('%', :term, '%')
             order by c.name asc
            """)
    List<Customer> search(@Param("term") String term);
}
