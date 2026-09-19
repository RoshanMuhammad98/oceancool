package com.oceancool.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Open on purpose: a host's health check has no login token, and pointing it at a real
 * endpoint would have it marking the service dead the moment the API started requiring
 * one. Exposes nothing about the data.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}
