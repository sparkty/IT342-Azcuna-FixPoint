package com.azcuna.fixpoint.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.azcuna.fixpoint.R
import com.azcuna.fixpoint.api.ApiClient
import com.azcuna.fixpoint.model.LoginRequest
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private val authService = ApiClient.retrofit.create(
        com.azcuna.fixpoint.api.AuthApiService::class.java
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        val etEmail = findViewById<EditText>(R.id.etEmail)
        val etPassword = findViewById<EditText>(R.id.etPassword)
        val btnLogin = findViewById<Button>(R.id.btnLogin)
        val tvGoToRegister = findViewById<TextView>(R.id.tvGoToRegister)

        btnLogin.setOnClickListener {
            val email = etEmail.text.toString().trim()
            val password = etPassword.text.toString().trim()

            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            btnLogin.isEnabled = false
            btnLogin.text = "Signing in..."

            lifecycleScope.launch {
                try {
                    val response = authService.login(LoginRequest(email, password))
                    if (response.isSuccessful && response.body()?.success == true) {
                        val user = response.body()?.data?.user
                        val intent = Intent(this@LoginActivity, HomeActivity::class.java).apply {
                            putExtra("firstname", user?.firstname)
                            putExtra("lastname", user?.lastname)
                            putExtra("email", user?.email)
                            putExtra("role", user?.role)
                        }
                        startActivity(intent)
                        finish()
                    } else {
                        val errorMsg = response.body()?.error?.message ?: "Invalid credentials"
                        Toast.makeText(this@LoginActivity, errorMsg, Toast.LENGTH_LONG).show()
                    }
                } catch (e: Exception) {
                    Toast.makeText(this@LoginActivity, "Network error: ${e.message}", Toast.LENGTH_LONG).show()
                } finally {
                    btnLogin.isEnabled = true
                    btnLogin.text = "Sign In"
                }
            }
        }

        tvGoToRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
            finish()
        }
    }
}