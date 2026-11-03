package com.smartsensor.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "devices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Device {
    @Id
    private String code;      // LED1 / LED2
    private String name;      // Đèn LED 1 / Đèn LED 2
    private boolean state;    // true = đang bật
}