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

    @Async
    public void sendWelcomeEmail(String toEmail, String firstname) {
        Context context = new Context();
        context.setVariable("firstname", firstname);
        context.setVariable("loginUrl", "http://localhost:5173/login");

        String html = templateEngine.process("email/welcome", context);
        sendHtmlEmail(toEmail, "Welcome to FixPoint!", html);
    }

    @Async
    public void sendStatusUpdateEmail(String toEmail, String firstname,
                                      Long issueId, String issueTitle,
                                      String newStatus) {
        Context context = new Context();
        context.setVariable("firstname", firstname);
        context.setVariable("issueId", issueId);
        context.setVariable("issueTitle", issueTitle);
        context.setVariable("newStatus", newStatus);
        context.setVariable("issueUrl", "http://localhost:5173/issues/" + issueId);

        String html = templateEngine.process("email/issue-status-update", context);
        sendHtmlEmail(toEmail, "FixPoint – Issue #" + issueId + " Status Updated", html);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(new InternetAddress(fromEmail, fromName));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            // swallowed — email failure won't crash registration or issue update
        }
    }
}