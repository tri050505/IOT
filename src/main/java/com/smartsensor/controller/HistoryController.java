package com.smartsensor.controller;

import com.smartsensor.entity.DeviceHistory;
import com.smartsensor.repository.DeviceHistoryRepository;
import com.smartsensor.util.Names;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api")
public class HistoryController {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final DeviceHistoryRepository repo;

    public HistoryController(DeviceHistoryRepository repo) {
        this.repo = repo;
    }

    // Bảng "Lịch sử": đúng định dạng mà table.js đang dùng
    @GetMapping("/history")
    public List<Map<String, Object>> list() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (DeviceHistory h : repo.findTop1000ByOrderByIdDesc()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", "#" + h.getId());
            m.put("device", Names.device(h.getDeviceCode()));
            m.put("status", Names.status(h.getStatus()));
            m.put("action", Names.action(h.getAction()));
            m.put("time", h.getCreatedAt().format(FMT));
            m.put("ts", h.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            result.add(m);
        }
        return result;
    }
}