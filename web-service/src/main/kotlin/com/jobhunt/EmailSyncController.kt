package com.jobhunt

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.client.RestTemplate
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

data class EmailSyncResponse(
    val syncId: String,
    val status: String,
    val startedAt: String,
    val completedAt: String?,
    val emailsFetched: Int?,
    val emailsProcessed: Int?,
    val errorMessage: String?,
)

private data class WorkerSyncRequest(
    val syncId: String,
    val userId: String,
    val accessToken: String,
    val refreshToken: String,
    val tokenExpiry: String?,
    val label: String?,
)

@RestController
@RequestMapping("/email-syncs")
class EmailSyncController(
    private val syncRepo: EmailSyncRepository,
    private val emailSettingsRepo: EmailSettingsRepository,
    private val tokenEncryption: TokenEncryption,
    private val restTemplate: RestTemplate,
    @Value("\${email.worker.url:http://localhost:8001}") private val workerUrl: String,
) {
    private val log = LoggerFactory.getLogger(EmailSyncController::class.java)

    private fun currentUserId() = UUID.fromString(SecurityContextHolder.getContext().authentication.name)

    @PostMapping
    fun startSync(): ResponseEntity<EmailSyncResponse> {
        val userId = currentUserId()
        log.info("POST /email-syncs userId={}", userId)

        val settings = emailSettingsRepo.findById(userId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Email settings not found")
        }

        val sync = try {
            syncRepo.saveAndFlush(EmailSync(userId = userId))
        } catch (ex: DataIntegrityViolationException) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "A sync is already running")
        }

        runCatching {
            val body = WorkerSyncRequest(
                syncId = sync.syncId.toString(),
                userId = userId.toString(),
                accessToken = tokenEncryption.decrypt(settings.accessToken),
                refreshToken = tokenEncryption.decrypt(settings.refreshToken),
                tokenExpiry = settings.tokenExpiry?.toString(),
                label = settings.label,
            )
            val headers = HttpHeaders().apply { contentType = MediaType.APPLICATION_JSON }
            restTemplate.postForEntity("$workerUrl/sync", HttpEntity(body, headers), String::class.java)
        }.onFailure { ex ->
            log.error("Failed to notify email-worker for syncId={}: {}", sync.syncId, ex.message)
        }

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(sync.toResponse())
    }

    @GetMapping
    fun listSyncs(): List<EmailSyncResponse> {
        val userId = currentUserId()
        log.info("GET /email-syncs userId={}", userId)
        return syncRepo.findAllByUserIdOrderByStartedAtDesc(userId).map { it.toResponse() }
    }

    @GetMapping("/{syncId}")
    fun getSync(@PathVariable syncId: String): EmailSyncResponse {
        val userId = currentUserId()
        val uuid = runCatching { UUID.fromString(syncId) }.getOrElse {
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        return syncRepo.findBySyncIdAndUserId(uuid, userId)
            ?.toResponse()
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
    }

    private fun EmailSync.toResponse() = EmailSyncResponse(
        syncId = syncId.toString(),
        status = status,
        startedAt = startedAt.toString(),
        completedAt = completedAt?.toString(),
        emailsFetched = emailsFetched,
        emailsProcessed = emailsProcessed,
        errorMessage = errorMessage,
    )
}
