package com.azcuna.fixpoint.model

data class RegisterRequest(
    val firstname: String,
    val lastname: String,
    val email: String,
    val password: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class UserData(
    val email: String,
    val firstname: String,
    val lastname: String,
    val role: String?
)

data class AuthData(
    val user: UserData,
    val accessToken: String,
    val refreshToken: String
)

data class AuthResponse(
    val success: Boolean,
    val data: AuthData?,
    val error: ErrorBody?,
    val timestamp: String
)

data class ErrorBody(
    val code: String,
    val message: String,
    val details: Any?
)