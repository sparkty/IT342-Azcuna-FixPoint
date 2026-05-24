package edu.cit.azcuna.fixpoint;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class FixpointApplication {

	public static void main(String[] args) {
		SpringApplication.run(FixpointApplication.class, args);
	}

}
