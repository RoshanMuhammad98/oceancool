package com.oceancool.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Every endpoint needs a login token except the three that cannot: signing in, signing
 * out, and the health check a host polls to decide whether the service is alive.
 *
 * <p>The token is opaque and held in memory by {@code UserService}, so a restart signs
 * everyone out — the React app treats a 401 as "session over" and returns to the login
 * screen. Swapping in JWTs is a change inside {@code UserService} alone.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, TokenAuthFilter tokenAuthFilter)
            throws Exception {
        return http
                // no cookies are used, so there is no CSRF surface to protect
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/login", "/api/auth/logout", "/api/health")
                        .permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(tokenAuthFilter, UsernamePasswordAuthenticationFilter.class)
                // answer in the same JSON shape as every other error, so the React
                // client can read .message instead of parsing Spring's default page
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, failure) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.getWriter().write(
                                    "{\"status\":401,\"error\":\"Unauthorized\","
                                            + "\"message\":\"Your session has ended. "
                                            + "Please sign in again.\"}");
                        })
                        .accessDeniedHandler((request, response, failure) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.getWriter().write(
                                    "{\"status\":403,\"error\":\"Forbidden\","
                                            + "\"message\":\"You do not have access to that.\"}");
                        }))
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
