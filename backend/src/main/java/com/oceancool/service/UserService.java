package com.oceancool.service;

import com.oceancool.dto.LoginRequest;
import com.oceancool.dto.LoginResponse;
import com.oceancool.entity.User;
import com.oceancool.exception.UnauthorizedException;
import com.oceancool.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Login only — one company, a handful of staff accounts.
 *
 * <p>The token is an opaque UUID held in memory (so it clears on restart) rather than a
 * JWT. When signed tokens are wanted, replace {@link #issueToken} and {@link #resolve}
 * with a JwtService and add the filter in {@code SecurityConfig}; no controller or DTO
 * has to change, because {@link LoginResponse} already looks like a token response.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Map<String, Long> activeTokens = new ConcurrentHashMap<>();

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsernameIgnoreCase(request.username().trim())
                .orElseThrow(() -> new UnauthorizedException("Wrong username or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new UnauthorizedException("Wrong username or password");
        }

        return new LoginResponse(issueToken(user), user.getId(), user.getUsername(), user.getDisplayName());
    }

    public void logout(String token) {
        if (token != null) {
            activeTokens.remove(token);
        }
    }

    /** Which user a token belongs to, or empty when it is unknown or expired. */
    public Optional<Long> resolve(String token) {
        return token == null ? Optional.empty() : Optional.ofNullable(activeTokens.get(token));
    }

    private String issueToken(User user) {
        String token = UUID.randomUUID().toString().replace("-", "");
        activeTokens.put(token, user.getId());
        return token;
    }
}
