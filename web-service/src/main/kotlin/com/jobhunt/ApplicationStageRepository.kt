package com.jobhunt

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ApplicationStageRepository : JpaRepository<ApplicationStage, UUID>
