package com.smartsensor;

import com.smartsensor.entity.Account;
import com.smartsensor.entity.Device;
import com.smartsensor.repository.AccountRepository;
import com.smartsensor.repository.DeviceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmartSensorBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartSensorBackendApplication.class, args);
    }

    // Tạo sẵn dữ liệu ban đầu: 2 đèn và 1 tài khoản
    @Bean
    CommandLineRunner init(DeviceRepository deviceRepo, AccountRepository accountRepo) {
        return args -> {
            if (!deviceRepo.existsById("LED1")) deviceRepo.save(new Device("LED1", "Đèn LED 1", false));
            if (!deviceRepo.existsById("LED2")) deviceRepo.save(new Device("LED2", "Đèn LED 2", false));
            if (!accountRepo.existsById(1L)) accountRepo.save(new Account(1L, "", "", "", "", ""));
        };
    }
}