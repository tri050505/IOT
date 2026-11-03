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
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) throws IOException {
        String name = file.getOriginalFilename() == null ? "file.pdf" : file.getOriginalFilename();

        if (!name.toLowerCase().endsWith(".pdf"))
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ chấp nhận file PDF"));
        if (file.getSize() > MAX_SIZE)
            return ResponseEntity.badRequest().body(Map.of("message", "File vượt quá 10MB"));

        // Kiểm tra nội dung thật sự là PDF (file PDF luôn bắt đầu bằng %PDF)
        byte[] head = file.getInputStream().readNBytes(4);
        if (!"%PDF".equals(new String(head, StandardCharsets.US_ASCII)))
            return ResponseEntity.badRequest().body(Map.of("message", "File không phải PDF hợp lệ"));

        // Lưu bằng tên ngẫu nhiên (không dùng tên gốc để tránh lỗi bảo mật)
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);
        String saved = UUID.randomUUID() + ".pdf";
        file.transferTo(dir.resolve(saved).toAbsolutePath());

        Account a = get();
        a.setPdfName(name);
        a.setPdfFile(saved);
        repo.save(a);

        return ResponseEntity.ok(Map.of("pdfName", name));
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