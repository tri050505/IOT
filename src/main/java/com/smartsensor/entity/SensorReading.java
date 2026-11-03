package com.smartsensor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_readings")
@Getter @Setter @NoArgsConstructor
public class SensorReading {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String type;       // Ánh sáng / Nhiệt độ / Độ ẩm
    private double reading;    // giá trị số
    private String unit;       // " Lux", "°C", "%"
    private String status;     // Hoạt động / Lỗi
    private LocalDateTime createdAt;
}