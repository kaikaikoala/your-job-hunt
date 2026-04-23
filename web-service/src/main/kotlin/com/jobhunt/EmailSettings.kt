package com.jobhunt

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "email_settings")
class EmailSettings(
    @Id
    @Column(name = "user_id")
    val userId: UUID,

    @Column(nullable = false)
    val email: String,

    val label: String? = null,

    @Column(name = "token_expiry")
    val tokenExpiry: Instant? = null,

    @Column(name = "access_token", nullable = false)
    val accessToken: String,

    @Column(name = "refresh_token", nullable = false)
    val refreshToken: String,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    val updatedAt: Instant = Instant.now(),
)
