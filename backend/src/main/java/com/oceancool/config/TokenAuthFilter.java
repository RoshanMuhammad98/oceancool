package com.oceancool.config;

import com.oceancool.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Turns the {@code Authorization: Bearer <token>} header into an authenticated request.
 *
 * <p>The token is the opaque one {@link UserService} hands out at login. A missing or
 * unknown token simply leaves the request unauthenticated — {@code SecurityConfig}
 * then decides whether that endpoint allows it, and answers 401 if not.
 *
 * <p>When these become JWTs, only {@link UserService#resolve} changes; this filter and
 * everything downstream stay as they are.
 */
@Component
public class TokenAuthFilter extends OncePerRequestFilter {

    private static final String BEARER = "Bearer ";

    private final UserService userService;

    public TokenAuthFilter(UserService userService) {
        this.userService = userService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header != null && header.startsWith(BEARER)
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = header.substring(BEARER.length()).trim();
            userService.resolve(token).ifPresent(userId -> {
                var authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            });
        }

        chain.doFilter(request, response);
    }
}
