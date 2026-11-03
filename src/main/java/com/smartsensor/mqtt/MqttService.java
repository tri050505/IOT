package com.smartsensor.mqtt;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsensor.entity.DeviceHistory;
import com.smartsensor.entity.SensorReading;
import com.smartsensor.repository.DeviceHistoryRepository;
import com.smartsensor.repository.DeviceRepository;
import com.smartsensor.repository.SensorReadingRepository;
import jakarta.annotation.PostConstruct;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MqttService {

    // ===== TÊN TOPIC: phải trùng với code Arduino =====
    private static final String TOPIC_SENSOR   = "data-sensor";        // ESP -> BE: dữ liệu cảm biến
    private static final String TOPIC_FEEDBACK = "data-feedback";      // ESP -> BE: phản hồi bật/tắt đèn
    private static final String TOPIC_CONTROL  = "device-control";     // BE -> ESP: lệnh điều khiển
    private static final String TOPIC_STATUS   = "iot/esp8266/status"; // ESP -> BE: online/offline

    @Value("${mqtt.broker}") private String broker;
    @Value("${mqtt.username}") private String username;
    @Value("${mqtt.password}") private String password;
    @Value("${app.save-interval-seconds}") private int saveIntervalSeconds;

    private final SensorReadingRepository sensorRepo;
    private final DeviceHistoryRepository historyRepo;
    private final DeviceRepository deviceRepo;
    private final ObjectMapper mapper = new ObjectMapper();

    private MqttClient client;
    private MqttConnectOptions options;

    // Giá trị mới nhất (giữ trong bộ nhớ để Dashboard hiện nhanh)
    private volatile double light, temperature, humidity;
    private volatile boolean hasData = false;
    private volatile long lastSensorTime = 0;
    private long lastSaveTime = 0;

    public MqttService(SensorReadingRepository sensorRepo, DeviceHistoryRepository historyRepo,
                       DeviceRepository deviceRepo) {
        this.sensorRepo = sensorRepo;
        this.historyRepo = historyRepo;
        this.deviceRepo = deviceRepo;
    }

    // ---------- Tạo client (chưa kết nối) ----------
    @PostConstruct
    public void init() throws MqttException {
        client = new MqttClient(broker, "backend-" + System.currentTimeMillis(), new MemoryPersistence());
        options = new MqttConnectOptions();
        options.setUserName(username);
        options.setPassword(password.toCharArray());
        options.setCleanSession(true);
        options.setConnectionTimeout(5);
        options.setKeepAliveInterval(15);

        client.setCallback(new MqttCallback() {
            @Override
            public void connectionLost(Throwable cause) {
                System.out.println("[MQTT] Mất kết nối broker, sẽ thử lại...");
            }

            @Override
            public void messageArrived(String topic, MqttMessage message) {
                try {
                    String payload = new String(message.getPayload(), StandardCharsets.UTF_8);
                    handle(topic, payload, message.isRetained());
                } catch (Exception e) {
                    System.err.println("[MQTT] Lỗi xử lý tin nhắn từ " + topic + ": " + e.getMessage());
                }
            }

            @Override
            public void deliveryComplete(IMqttDeliveryToken token) { }
        });
    }

    // ---------- Cứ 5 giây kiểm tra, mất kết nối thì kết nối lại ----------
    @Scheduled(fixedDelay = 5000)
    public void ensureConnected() {
        if (client.isConnected()) return;
        try {
            client.connect(options);
            client.subscribe(new String[]{TOPIC_SENSOR, TOPIC_FEEDBACK, TOPIC_STATUS});
            System.out.println("[MQTT] Đã kết nối broker " + broker);
        } catch (MqttException e) {
            System.err.println("[MQTT] Chưa kết nối được broker: " + e.getMessage());
        }
    }

    // ---------- Phân loại tin nhắn theo topic ----------
    private void handle(String topic, String payload, boolean retained) throws Exception {
        switch (topic) {
            case TOPIC_SENSOR   -> onSensor(payload);
            case TOPIC_FEEDBACK -> onFeedback(payload);
            case TOPIC_STATUS   -> onStatus(payload, retained);
            default -> { }
        }
    }

    // ---------- 1. Dữ liệu cảm biến: {"temperature":..,"humidity":..,"light":..} ----------
    private void onSensor(String payload) throws Exception {
        JsonNode n = mapper.readTree(payload);
        temperature = n.path("temperature").asDouble();
        humidity = n.path("humidity").asDouble();
        light = n.path("light").asDouble();
        hasData = true;
        lastSensorTime = System.currentTimeMillis();

        // Chỉ lưu DB mỗi N giây
        long now = System.currentTimeMillis();
        if (now - lastSaveTime >= saveIntervalSeconds * 1000L) {
            lastSaveTime = now;
            saveReadings();
        }
    }

    private void saveReadings() {
        // Code Arduino gán 0 và 0 khi DHT11 đọc lỗi
        boolean dhtError = (temperature == 0 && humidity == 0);
        String dhtStatus = dhtError ? "Lỗi" : "Hoạt động";
        LocalDateTime t = LocalDateTime.now();

        sensorRepo.saveAll(List.of(
                make("Ánh sáng", light, " Lux", "Hoạt động", t),
                make("Nhiệt độ", temperature, "°C", dhtStatus, t),
                make("Độ ẩm", humidity, "%", dhtStatus, t)
        ));
    }

    private SensorReading make(String type, double value, String unit, String status, LocalDateTime t) {
        SensorReading s = new SensorReading();
        s.setType(type);
        s.setReading(value);
        s.setUnit(unit);
        s.setStatus(status);
        s.setCreatedAt(t);
        return s;
    }

    // ---------- 2. Phản hồi bật/tắt đèn: {"deviceId":"LED1","action":"ON","status":"SUCCESS"} ----------
    private void onFeedback(String payload) throws Exception {
        JsonNode n = mapper.readTree(payload);
        String code = n.path("deviceId").asText();
        String action = n.path("action").asText();
        boolean ok = "SUCCESS".equals(n.path("status").asText());

        // Tìm dòng lịch sử đang "Đang xử lý" tương ứng và cập nhật kết quả
        historyRepo.findFirstByDeviceCodeAndActionAndStatusOrderByIdDesc(code, action, "PENDING")
                .ifPresent(h -> {
                    h.setStatus(ok ? "SUCCESS" : "FAILED");
                    historyRepo.save(h);
                });

        if (ok) {
            deviceRepo.findById(code).ifPresent(d -> {
                d.setState("ON".equals(action));
                deviceRepo.save(d);
            });
        }
    }

    // ---------- 3. Trạng thái ESP: "online" / "offline" ----------
    private void onStatus(String payload, boolean retained) {
        String s = payload.trim();
        if (s.equals("offline")) {
            lastSensorTime = 0;
        }
        // ESP vừa khởi động lại (tin nhắn trực tiếp, không phải tin giữ lại) -> 2 đèn về tắt
        if (s.equals("online") && !retained) {
            deviceRepo.findAll().forEach(d -> {
                d.setState(false);
                deviceRepo.save(d);
            });
        }
    }

    // ---------- Gửi lệnh xuống ESP: led1on, led1off, led2on, led2off ----------
    public boolean sendCommand(String code, boolean on) {
        try {
            if (!client.isConnected()) return false;
            String cmd = code.toLowerCase() + (on ? "on" : "off");
            client.publish(TOPIC_CONTROL, new MqttMessage(cmd.getBytes(StandardCharsets.UTF_8)));
            return true;
        } catch (MqttException e) {
            return false;
        }
    }

    // ESP được coi là online nếu có dữ liệu trong 10 giây gần nhất
    public boolean isOnline() {
        return System.currentTimeMillis() - lastSensorTime < 10_000;
    }

    public Map<String, Object> latestInfo() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("online", isOnline());
        m.put("hasData", hasData);
        m.put("light", light);
        m.put("temperature", temperature);
        m.put("humidity", humidity);
        return m;
    }
}