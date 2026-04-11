package edu.cit.azcuna.fixpoint.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final List<String> ALLOWED_TYPES = List.of(
            "image/png", "image/jpeg", "application/pdf"
    );
    private static final long MAX_SIZE = 10 * 1024 * 1024; // 10 MB

    private final Path storageDir;

    public FileStorageService(@Value("${file.upload-dir:uploads}") String uploadDir) throws IOException {
        this.storageDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.storageDir);
    }

    /**
     * Validates and stores the file.
     * @return the generated unique filename saved on disk
     */
    public String store(MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty.");
        if (!ALLOWED_TYPES.contains(file.getContentType()))
            throw new IllegalArgumentException("Only PNG, JPG, and PDF files are allowed.");
        if (file.getSize() > MAX_SIZE)
            throw new IllegalArgumentException("File must be under 10 MB.");

        String originalName = Path.of(file.getOriginalFilename()).getFileName().toString();
        String storedName   = UUID.randomUUID() + "_" + originalName;
        Files.copy(file.getInputStream(), storageDir.resolve(storedName), StandardCopyOption.REPLACE_EXISTING);
        return storedName;
    }

    /**
     * Loads a file as a Resource for download/view.
     */
    public Resource load(String filename) throws MalformedURLException {
        Path filePath = storageDir.resolve(filename).normalize();
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists()) throw new RuntimeException("File not found: " + filename);
        return resource;
    }

    /**
     * Deletes a stored file silently.
     */
    public void delete(String filename) {
        try {
            Files.deleteIfExists(storageDir.resolve(filename).normalize());
        } catch (IOException ignored) {}
    }
}
