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

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            log.info("Preparing email to {}", to);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(new InternetAddress(fromEmail, fromName));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            log.info("Sending email to {}", to);

            mailSender.send(message);

            log.info("Email successfully sent to {}", to);

        } catch (Exception e) {
            log.error("Failed to send email to {}", to, e);
        }
    }
}
