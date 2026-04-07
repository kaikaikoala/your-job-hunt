package com.jobhunt

import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface ApplicationStageRepository : JpaRepository<ApplicationStage, UUID> {

    fun findAllByAppId(appId: UUID): List<ApplicationStage>

    @Query("SELECT s FROM ApplicationStage s WHERE s.appId = :appId ORDER BY s.stageDate DESC NULLS LAST, s.appStageId DESC")
    fun findLatestByAppId(@Param("appId") appId: UUID, pageable: Pageable): List<ApplicationStage>
}
