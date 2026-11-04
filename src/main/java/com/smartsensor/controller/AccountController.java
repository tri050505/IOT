package com.smartsensor.controller;

import com.smartsensor.entity.Account;
import com.smartsensor.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    private static final long MAX_SIZE = 10L * 1024 * 1024;   // 10MB

    private final AccountRepository repo;

    @Value("${app.upload-dir}")
    private String uploadDir;

    public AccountController(AccountRepository repo) {
        this.repo = repo;
    }

    private Account get() {
        return repo.findById(1L).orElseGet(() -> repo.save(new Account(1L, "", "", "", "", "")));
    }

    // Lấy thông tin tài khoản
    @GetMapping
    public Account info() {
        return get();
    }

    // Lưu 3 link: body {"github":"..","figma":"..","postman":".."}
    @PutMapping
    public Account update(@RequestBody Map<String, String> body) {
        Account a = get();
        a.setGithub(body.getOrDefault("github", ""));
        a.setFigma(body.getOrDefault("figma", ""));
        a.setPostman(body.getOrDefault("postman", ""));
        return repo.save(a);
    }

    // Upload file PDF
    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            if (file == null || file.isEmpty())
                return ResponseEntity.badRequest().body(Map.of("message", "Chưa chọn file để upload"));

            String name = file.getOriginalFilename() == null ? "file.pdf" : file.getOriginalFilename();
            if (!name.toLowerCase().endsWith(".pdf"))
                return ResponseEntity.badRequest().body(Map.of("message", "Chỉ chấp nhận file PDF"));
            if (file.getSize() > MAX_SIZE)
                return ResponseEntity.badRequest().body(Map.of("message", "File vượt quá 10MB"));

            // Đọc cả file vào bộ nhớ (tối đa 10MB) rồi kiểm tra đầu file có đúng là PDF không
            byte[] data = file.getBytes();
            if (data.length < 4 || !"%PDF".equals(new String(data, 0, 4, StandardCharsets.US_ASCII)))
                return ResponseEntity.badRequest().body(Map.of("message", "File không phải PDF hợp lệ"));

            // Lưu bằng tên ngẫu nhiên (không dùng tên gốc để tránh lỗi bảo mật)
            Path dir = Paths.get(uploadDir).toAbsolutePath();
            Files.createDirectories(dir);
            String saved = UUID.randomUUID() + ".pdf";
            Files.write(dir.resolve(saved), data);

            Account a = get();
            a.setPdfName(name);
            a.setPdfFile(saved);
            repo.save(a);

            return ResponseEntity.ok(Map.of("pdfName", name));
        } catch (Exception e) {
            e.printStackTrace();   // in lỗi chi tiết ra Console của IntelliJ
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi server: " + e));
        }
    }
    // Mở file PDF đã upload
    @GetMapping("/pdf")
    public ResponseEntity<Resource> pdf() {
        Account a = get();
        if (a.getPdfFile() == null || a.getPdfFile().isEmpty()) return ResponseEntity.notFound().build();

        Path p = Paths.get(uploadDir).resolve(a.getPdfFile());
        if (!Files.exists(p)) return ResponseEntity.notFound().build();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(new FileSystemResource(p));
    }
}