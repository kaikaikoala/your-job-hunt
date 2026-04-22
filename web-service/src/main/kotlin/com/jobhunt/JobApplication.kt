package com.jobhunt

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "applications")
class JobApplication(
    @Id
    @Column(name = "app_id")
    val appId: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(nullable = false)
    val company: String,

    @Column(nullable = false)
    val role: String,

    @Column(name = "job_posting_url")
    val jobPostingUrl: String? = null,

    @Column(name = "salary_range")
    val salaryRange: String? = null,

    @Column(name = "referrer_id")
    val referrerId: UUID? = null,
)
