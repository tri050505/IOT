package com.smartsensor.repository;

import com.smartsensor.entity.SensorReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {

    List<SensorReading> findTop1000ByOrderByIdDesc();

    // Trung bình theo từng giờ (dùng cho biểu đồ), bỏ qua các dòng bị lỗi
    @Query(value = "SELECT HOUR(created_at), AVG(reading) FROM sensor_readings " +
            "WHERE type = :type AND status = 'Hoạt động' AND created_at >= :since " +
            "GROUP BY HOUR(created_at)", nativeQuery = true)
    List<Object[]> hourlyAverage(@Param("type") String type, @Param("since") LocalDateTime since);
}