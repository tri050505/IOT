package com.smartsensor.util;

public class Names {

    public static String device(String code) {
        if ("LED1".equals(code)) return "Đèn LED 1";
        if ("LED2".equals(code)) return "Đèn LED 2";
        return code;
    }

    public static String action(String action) {
        return "ON".equals(action) ? "Bật thiết bị" : "Tắt thiết bị";
    }

    public static String status(String status) {
        if ("SUCCESS".equals(status)) return "Thành công";
        if ("FAILED".equals(status)) return "Thất bại";
        return "Đang xử lý";   // PENDING
    }
}