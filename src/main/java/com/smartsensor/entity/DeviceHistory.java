package com.smartsensor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "device_history")
@Getter @Setter @NoArgsConstructor
public class DeviceHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String deviceCode;   // LED1 / LED2
    private String action;       // ON / OFF
    private String status;       // PENDING / SUCCESS / FAILED
    private LocalDateTime createdAt;
}