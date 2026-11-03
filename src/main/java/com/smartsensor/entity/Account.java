package com.smartsensor.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "accounts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Account {
    @Id
    private Long id;          // luôn là 1 (chỉ có 1 tài khoản)
    private String github;
    private String figma;
    private String postman;
    private String pdfName;   // tên file gốc để hiển thị
    private String pdfFile;   // tên file lưu trên server (UUID)
}