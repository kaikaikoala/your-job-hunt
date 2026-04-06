package com.jobhunt

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ApplicationRepository : JpaRepository<JobApplication, UUID> {
    fun findAllByUserId(userId: String): List<JobApplication>
}
