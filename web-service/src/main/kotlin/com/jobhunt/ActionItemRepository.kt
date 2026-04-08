package com.jobhunt

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ActionItemRepository : JpaRepository<ActionItem, UUID> {
    fun findAllByUserId(userId: String): List<ActionItem>
}
