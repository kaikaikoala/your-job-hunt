package com.jobhunt

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ApplicationRepository : JpaRepository<JobApplication, UUID> {
    fun findAllByUserId(userId: String): List<JobApplication>
    fun findByAppIdAndUserId(appId: UUID, userId: String): JobApplication?
    fun countByReferrerIdAndUserId(referrerId: UUID, userId: String): Int
}
