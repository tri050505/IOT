package com.smartsensor.controller;

import com.smartsensor.entity.Device;
import com.smartsensor.entity.DeviceHistory;
import com.smartsensor.mqtt.MqttService;
import com.smartsensor.repository.DeviceHistoryRepository;
import com.smartsensor.repository.DeviceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private static final int WAIT_MS = 5000;   // chờ ESP phản hồi tối đa 5 giây

    private final DeviceRepository deviceRepo;
    private final DeviceHistoryRepository historyRepo;
    private final MqttService mqtt;

    public DeviceController(DeviceRepository deviceRepo, DeviceHistoryRepository historyRepo, MqttService mqtt) {
        this.deviceRepo = deviceRepo;
        this.historyRepo = historyRepo;
        this.mqtt = mqtt;
    }

    // Trạng thái 2 đèn (để công tắc trên Dashboard hiện đúng khi mở trang)
    @GetMapping
    public List<Map<String, Object>> list() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Device d : deviceRepo.findAll()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", d.getCode());
            m.put("name", d.getName());
            m.put("on", d.isState());
            result.add(m);
        }
        return result;
    }

    // Bật/tắt đèn: body {"on": true}
    @PostMapping("/{code}/control")
    public ResponseEntity<Map<String, Object>> control(@PathVariable String code,
                                                       @RequestBody Map<String, Boolean> body) {
        boolean on = Boolean.TRUE.equals(body.get("on"));
        if (!deviceRepo.existsById(code)) return ResponseEntity.notFound().build();

        DeviceHistory h = new DeviceHistory();
        h.setDeviceCode(code);
        h.setAction(on ? "ON" : "OFF");
        h.setCreatedAt(LocalDateTime.now());

        // ESP đang offline -> thất bại ngay
        if (!mqtt.isOnline()) {
            h.setStatus("FAILED");
            historyRepo.save(h);
            return ResponseEntity.ok(result(false, "Thiết bị đang offline"));
        }

        // Ghi lịch sử "Đang xử lý" rồi gửi lệnh xuống ESP
        h.setStatus("PENDING");
        h = historyRepo.save(h);
        if (!mqtt.sendCommand(code, on)) {
            h.setStatus("FAILED");
            historyRepo.save(h);
            return ResponseEntity.ok(result(false, "Không gửi được lệnh tới broker"));
        }

        // Chờ ESP phản hồi (MqttService sẽ cập nhật trạng thái trong DB)
        for (int i = 0; i < WAIT_MS / 100; i++) {
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
            String st = historyRepo.findById(h.getId()).map(DeviceHistory::getStatus).orElse("PENDING");
            if (!st.equals("PENDING")) {
                boolean ok = st.equals("SUCCESS");
                return ResponseEntity.ok(result(ok, ok ? "Thành công" : "Thiết bị báo thất bại"));
            }
        }

        // Quá thời gian chờ
        h.setStatus("FAILED");
        historyRepo.save(h);
        return ResponseEntity.ok(result(false, "Hết thời gian chờ phản hồi từ thiết bị"));
    }

    private Map<String, Object> result(boolean success, String message) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("success", success);
        m.put("message", message);
        return m;
    }
}