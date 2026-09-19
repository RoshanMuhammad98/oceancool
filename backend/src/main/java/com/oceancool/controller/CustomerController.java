package com.oceancool.controller;

import com.oceancool.dto.CustomerDetailResponse;
import com.oceancool.dto.CustomerRequest;
import com.oceancool.dto.CustomerResponse;
import com.oceancool.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    /** @param search optional name or phone-number fragment */
    @GetMapping
    public List<CustomerResponse> list(@RequestParam(required = false) String search) {
        return customerService.list(search);
    }

    /** Customer header plus their full service history — one call for the detail screen. */
    @GetMapping("/{id}")
    public CustomerDetailResponse detail(@PathVariable Long id) {
        return customerService.detail(id);
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CustomerRequest request) {
        CustomerResponse created = customerService.create(request);
        return ResponseEntity.created(URI.create("/api/customers/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public CustomerResponse update(@PathVariable Long id,
                                   @Valid @RequestBody CustomerRequest request) {
        return customerService.update(id, request);
    }

    /**
     * @param force set true to remove the customer's service history along with them.
     *              Without it, a customer who has records is refused (business rule 9).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @RequestParam(defaultValue = "false") boolean force) {
        customerService.delete(id, force);
        return ResponseEntity.noContent().build();
    }
}
