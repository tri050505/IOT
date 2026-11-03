package com.smartsensor.controller;

import com.smartsensor.mqtt.MqttService;
import com.smartsensor.repository.SensorReadingRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartsensor.entity.SensorReading;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api")
public class SensorController {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final SensorReadingRepository repo;
    private final MqttService mqtt;

    public SensorController(SensorReadingRepository repo, MqttService mqtt) {
        this.repo = repo;
        this.mqtt = mqtt;
    }

    // Nhãn "Connected" trên cả 4 trang
    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of("online", mqtt.isOnline());
    }

    // 3 ô trên Dashboard
    @GetMapping("/sensors/latest")
    public Map<String, Object> latest() {
        return mqtt.latestInfo();
    }

    // Bảng "Dữ liệu cảm biến": đúng định dạng mà table.js đang dùng
    @GetMapping("/sensors")
    public List<Map<String, Object>> list() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (SensorReading s : repo.findTop1000ByOrderByIdDesc()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", "#" + s.getId());
            m.put("type", s.getType());
            m.put("value", formatValue(s));
            m.put("status", s.getStatus());
            m.put("time", s.getCreatedAt().format(FMT));
            m.put("ts", s.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            result.add(m);
        }
        return result;
    }

    // Biểu đồ: trung bình theo giờ trong 12 giờ gần nhất
    @GetMapping("/sensors/chart")
    public Map<String, Object> chart() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime since = now.minusHours(12);
        Map<Integer, Double> light = hourly("Ánh sáng", since);
        Map<Integer, Double> temp = hourly("Nhiệt độ", since);
        Map<Integer, Double> hum = hourly("Độ ẩm", since);

        List<String> labels = new ArrayList<>();
        List<Double> lightList = new ArrayList<>(), tempList = new ArrayList<>(), humList = new ArrayList<>();

        for (int i = 11; i >= 0; i--) {
            int h = now.minusHours(i).getHour();
            if (light.containsKey(h) && temp.containsKey(h) && hum.containsKey(h)) {
                labels.add(String.format("%02d:00", h));
                lightList.add(round1(light.get(h)));
                tempList.add(round1(temp.get(h)));
                humList.add(round1(hum.get(h)));
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("labels", labels);
        result.put("light", lightList);
        result.put("temperature", tempList);
        result.put("humidity", humList);
        return result;
    }

    private Map<Integer, Double> hourly(String type, LocalDateTime since) {
        Map<Integer, Double> map = new HashMap<>();
        for (Object[] row : repo.hourlyAverage(type, since)) {
            map.put(((Number) row[0]).intValue(), ((Number) row[1]).doubleValue());
        }
        return map;
    }

    private double round1(double v) {
        return Math.round(v * 10) / 10.0;
    }

    private String formatValue(SensorReading s) {
        String num = s.getType().equals("Nhiệt độ")
                ? String.format(Locale.US, "%.1f", s.getReading())
                : String.valueOf(Math.round(s.getReading()));
        return num + s.getUnit();
    }
}