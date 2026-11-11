package com.smartsensor.security;

import com.smartsensor.entity.User;
import com.smartsensor.repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AuthUserInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.auth.username}")
    private String username;

    @Value("${app.auth.password}")
    private String password;

    public AuthUserInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        // Chỉ tạo tài khoản nếu chưa tồn tại
        if (userRepository.findByUsername(username).isEmpty()) {

            User user = new User();

            user.setUsername(username);

            // Không lưu password dạng chữ thường
            user.setPassword(passwordEncoder.encode(password));

            user.setRole("ROLE_USER");

            userRepository.save(user);

            System.out.println("Da tao tai khoan dang nhap: " + username);
        }
    }
}