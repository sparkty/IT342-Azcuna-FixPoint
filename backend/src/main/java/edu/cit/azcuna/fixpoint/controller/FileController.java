package edu.cit.azcuna.fixpoint.controller;

import edu.cit.azcuna.fixpoint.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> download(@PathVariable String filename) throws MalformedURLException {
        Resource resource = fileStorageService.load(filename);

        String contentType = "application/octet-stream";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png"))  contentType = "image/png";
        else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
        else if (lower.endsWith(".pdf")) contentType = "application/pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }
}
