package com.jobhunt

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ActionItemRepository : JpaRepository<ActionItem, UUID> {
    fun findAllByUserId(userId: UUID): List<ActionItem>
    fun countByReferrerId(referrerId: UUID): Int
    fun countByAppId(appId: UUID): Int
}
