package edu.cit.azcuna.fixpoint.email;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.name}")
    private String fromName;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${resend.api-key:${RESEND_API_KEY:}}")
    private String resendApiKey;

    private String getNormalizedFrontendUrl() {
        if (frontendUrl == null) return "http://localhost:5173";
        return frontendUrl.replaceAll("/+$", "");
    }

    
    @Async
    public void sendWelcomeEmail(String toEmail, String firstname) {
        Context context = new Context();
        context.setVariable("firstname", firstname);
        context.setVariable("loginUrl", getNormalizedFrontendUrl() + "/login");

        String html = templateEngine.process("email/welcome", context);
        sendHtmlEmail(toEmail, "Welcome to FixPoint!", html);
    }

    @Async
    public void sendStatusUpdateEmail(String toEmail, String firstname,
                                      Long issueDisplayId, String issueTitle,
                                      String newStatus) {
        Context context = new Context();
        context.setVariable("firstname", firstname);
        context.setVariable("issueId", issueDisplayId);
        context.setVariable("issueTitle", issueTitle);
        context.setVariable("newStatus", newStatus);
        context.setVariable("issueUrl", getNormalizedFrontendUrl() + "/issue/" + issueDisplayId);

        String html = templateEngine.process("email/issue-status-update", context);
        sendHtmlEmail(toEmail, "FixPoint - Issue #" + issueDisplayId + " Status Updated", html);
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String firstname, String token) {
        Context context = new Context();
        context.setVariable("firstname", firstname);
        context.setVariable("resetUrl", getNormalizedFrontendUrl() + "/?resetToken=" + token);

        String html = templateEngine.process("email/password-reset", context);
        sendHtmlEmail(toEmail, "FixPoint - Reset your password", html);
    }

    /**
     * Synchronous email sending method for SMTP diagnostics and testing.
     */
    public void sendTestEmail(String toEmail, String subject, String body) {
        sendHtmlEmail(toEmail, subject, body);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        if (resendApiKey != null && !resendApiKey.trim().isEmpty()) {
            sendViaResend(to, subject, htmlBody);
            return;
        }

        try {
            log.info("Preparing SMTP email to {}", to);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(new InternetAddress(fromEmail, fromName));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            log.info("Sending SMTP email to {}", to);

            mailSender.send(message);

            log.info("Email successfully sent via SMTP to {}", to);

        }catch (Exception e) {
            log.error("=============================================================");
            log.error("                  FIXPOINT EMAIL DISPATCH FAILURE            ");
            log.error("=============================================================");
            log.error("Recipient: {}", to);
            log.error("Subject: {}", subject);
            log.error("From Email: {}", fromEmail);
            log.error("Error Message: {}", e.getMessage());
            log.error("Full Exception Stack Trace:", e);
            log.error("=============================================================");
            throw new RuntimeException(e);
        }
    }

    private void sendViaResend(String to, String subject, String htmlBody) {
        try {
            log.info("Sending email via Resend API to {}", to);

            // Escape parameters carefully for JSON construction
            String escapedFromName = fromName.replace("\\", "\\\\").replace("\"", "\\\"");
            String escapedFromEmail = fromEmail.replace("\\", "\\\\").replace("\"", "\\\"");
            String escapedTo = to.replace("\\", "\\\\").replace("\"", "\\\"");
            String escapedSubject = subject.replace("\\", "\\\\").replace("\"", "\\\"");
            
            String escapedHtml = htmlBody
                    .replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");

            String jsonPayload = String.format(
                    "{\"from\":\"%s <%s>\",\"to\":[\"%s\"],\"subject\":\"%s\",\"html\":\"%s\"}",
                    escapedFromName, escapedFromEmail, escapedTo, escapedSubject, escapedHtml
            );

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Email successfully sent via Resend API to {}! Response: {}", to, response.body());
            } else {
                throw new RuntimeException("Resend API returned error status " + response.statusCode() + ": " + response.body());
            }

        } catch (Exception e) {
            log.error("=============================================================");
            log.error("               FIXPOINT RESEND API EMAIL DISPATCH FAILURE    ");
            log.error("=============================================================");
            log.error("Recipient: {}", to);
            log.error("Subject: {}", subject);
            log.error("From Email: {}", fromEmail);
            log.error("Error Message: {}", e.getMessage());
            log.error("Full Exception Stack Trace:", e);
            log.error("=============================================================");
            throw new RuntimeException("Resend email dispatch failed: " + e.getMessage(), e);
        }
    }
}
