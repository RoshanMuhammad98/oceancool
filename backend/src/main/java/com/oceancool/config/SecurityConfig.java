package com.oceancool.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Spring Security is wired in but deliberately open for now — the login endpoint
 * verifies the password with BCrypt and hands back a token, and the React app keeps
 * users off the screens until it has one.
 *
 * <p>To lock the API down later: add a {@code JwtAuthFilter}, register it with
 * {@code .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)},
 * and change the {@code authorizeHttpRequests} block to
 * {@code .requestMatchers("/api/auth/**").permitAll().anyRequest().authenticated()}.
 * Nothing outside this class needs to change.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
