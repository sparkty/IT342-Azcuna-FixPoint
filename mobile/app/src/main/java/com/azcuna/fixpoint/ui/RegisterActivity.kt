package com.azcuna.fixpoint.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.azcuna.fixpoint.R
import com.azcuna.fixpoint.api.ApiClient
import com.azcuna.fixpoint.model.RegisterRequest
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {

    private val authService = ApiClient.retrofit.create(
        com.azcuna.fixpoint.api.AuthApiService::class.java
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        val etFirstname = findViewById<EditText>(R.id.etFirstname)
        val etLastname = findViewById<EditText>(R.id.etLastname)
        val etEmail = findViewById<EditText>(R.id.etEmail)
        val etPassword = findViewById<EditText>(R.id.etPassword)
        val btnRegister = findViewById<Button>(R.id.btnRegister)
        val tvGoToLogin = findViewById<TextView>(R.id.tvGoToLogin)

        btnRegister.setOnClickListener {
            val firstname = etFirstname.text.toString().trim()
            val lastname = etLastname.text.toString().trim()
            val email = etEmail.text.toString().trim()
            val password = etPassword.text.toString().trim()

            // Validation
            if (firstname.isEmpty() || lastname.isEmpty() || email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            if (password.length < 8) {
                Toast.makeText(this, "Password must be at least 8 characters", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            btnRegister.isEnabled = false
            btnRegister.text = "Registering..."

            lifecycleScope.launch {
                try {
                    val response = authService.register(
                        RegisterRequest(firstname, lastname, email, password)
                    )
                    if (response.isSuccessful && response.body()?.success == true) {
                        val user = response.body()?.data?.user
                        Toast.makeText(
                            this@RegisterActivity,
                            "Welcome, ${user?.firstname}! Account created.",
                            Toast.LENGTH_LONG
                        ).show()
                        startActivity(Intent(this@RegisterActivity, LoginActivity::class.java))
                        finish()
                    } else {
                        val errorMsg = response.body()?.error?.message ?: "Registration failed"
                        Toast.makeText(this@RegisterActivity, errorMsg, Toast.LENGTH_LONG).show()
                    }
                } catch (e: Exception) {
                    Toast.makeText(this@RegisterActivity, "Network error: ${e.message}", Toast.LENGTH_LONG).show()
                } finally {
                    btnRegister.isEnabled = true
                    btnRegister.text = "Register"
                }
            }
        }

        tvGoToLogin.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }
}