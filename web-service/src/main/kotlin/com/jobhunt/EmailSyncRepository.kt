package com.jobhunt

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface EmailSyncRepository : JpaRepository<EmailSync, UUID> {
    @Query("SELECT s FROM EmailSync s WHERE s.userId = :userId ORDER BY s.startedAt DESC")
    fun findAllByUserIdOrderByStartedAtDesc(@Param("userId") userId: UUID): List<EmailSync>

    fun findBySyncIdAndUserId(syncId: UUID, userId: UUID): EmailSync?
}
