package com.azcuna.fixpoint.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.azcuna.fixpoint.R

class HomeActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        val firstname = intent.getStringExtra("firstname") ?: "User"
        val lastname = intent.getStringExtra("lastname") ?: ""
        val email = intent.getStringExtra("email") ?: ""
        val role = intent.getStringExtra("role") ?: "USER"

        findViewById<TextView>(R.id.tvWelcome).text = "Welcome, $firstname $lastname!"
        findViewById<TextView>(R.id.tvEmail).text = "$email • $role"

        findViewById<Button>(R.id.btnLogout).setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }
}