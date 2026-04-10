package com.azcuna.fixpoint.api

import com.azcuna.fixpoint.model.AuthResponse
import com.azcuna.fixpoint.model.LoginRequest
import com.azcuna.fixpoint.model.RegisterRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApiService {
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
}