package com.smartsensor.repository;

import com.smartsensor.entity.DeviceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DeviceHistoryRepository extends JpaRepository<DeviceHistory, Long> {

    List<DeviceHistory> findTop1000ByOrderByIdDesc();

    Optional<DeviceHistory> findFirstByDeviceCodeAndActionAndStatusOrderByIdDesc(
            String deviceCode, String action, String status);
}