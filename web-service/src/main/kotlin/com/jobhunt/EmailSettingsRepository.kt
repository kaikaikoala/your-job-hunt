package com.jobhunt

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface EmailSettingsRepository : JpaRepository<EmailSettings, UUID>
