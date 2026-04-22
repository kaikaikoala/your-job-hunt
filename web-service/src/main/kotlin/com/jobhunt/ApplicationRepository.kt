package com.jobhunt

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ApplicationRepository : JpaRepository<JobApplication, UUID> {
    fun findAllByUserId(userId: UUID): List<JobApplication>
    fun findByAppIdAndUserId(appId: UUID, userId: UUID): JobApplication?
    fun countByReferrerIdAndUserId(referrerId: UUID, userId: UUID): Int
}
