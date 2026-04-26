package com.jobhunt

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "email_syncs")
class EmailSync(
    @Id
    @Column(name = "sync_id")
    val syncId: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(nullable = false)
    val status: String = "running",

    @Column(name = "started_at", nullable = false, updatable = false)
    val startedAt: Instant = Instant.now(),

    @Column(name = "completed_at")
    val completedAt: Instant? = null,

    @Column(name = "emails_fetched")
    val emailsFetched: Int? = null,

    @Column(name = "emails_processed")
    val emailsProcessed: Int? = null,

    @Column(name = "error_message")
    val errorMessage: String? = null,

    @Column(name = "application_updates")
    val applicationUpdates: Int? = null,
)
