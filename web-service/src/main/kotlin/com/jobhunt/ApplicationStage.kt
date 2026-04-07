package com.jobhunt

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "application_stage")
class ApplicationStage(
    @Id
    @Column(name = "app_stage_id")
    val appStageId: UUID = UUID.randomUUID(),

    @Column(name = "app_id", nullable = false)
    val appId: UUID,

    @Column(nullable = false)
    val stage: String,

    @Column(name = "stage_date")
    val stageDate: LocalDate? = null,

    @Column
    val result: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),
)
