package com.jobhunt

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface NetworkRepository : JpaRepository<NetworkContact, UUID> {
    fun findAllByUserId(userId: String): List<NetworkContact>
    fun findByReferrerIdAndUserId(referrerId: UUID, userId: String): NetworkContact?
}
