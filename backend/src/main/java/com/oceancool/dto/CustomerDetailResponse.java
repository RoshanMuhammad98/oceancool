package com.oceancool.dto;

import java.util.List;

/** Customer header plus the full service history, in one call for the detail screen. */
public record CustomerDetailResponse(
        CustomerResponse customer,
        List<ServiceResponse> services
) {
}
