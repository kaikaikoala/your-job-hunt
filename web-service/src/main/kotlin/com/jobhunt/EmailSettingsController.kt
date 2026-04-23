package com.jobhunt

import jakarta.transaction.Transactional
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.util.LinkedMultiValueMap
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.client.RestTemplate
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

data class ExchangeTokenRequest(val code: String, val redirectUri: String, val codeVerifier: String)
data class PatchEmailSettingsRequest(val label: String?)
data class EmailSettingsResponse(val email: String, val label: String?)

@RestController
@RequestMapping("/email-settings")
class EmailSettingsController(
    private val repo: EmailSettingsRepository,
    private val tokenEncryption: TokenEncryption,
    private val restTemplate: RestTemplate,
    @Value("\${app.gmail.client-id}") private val clientId: String,
    @Value("\${app.gmail.client-secret}") private val clientSecret: String,
) {
    private val log = org.slf4j.LoggerFactory.getLogger(EmailSettingsController::class.java)

    private fun currentUserId() = UUID.fromString(SecurityContextHolder.getContext().authentication.name)

    @GetMapping
    fun getEmailSettings(): EmailSettingsResponse {
        val userId = currentUserId()
        log.info("GET /email-settings userId={}", userId)
        val settings = repo.findById(userId)
        log.info("GET /email-settings findById present={}", settings.isPresent)
        return settings.orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }.toResponse()
    }

    @PostMapping
    @Transactional
    fun createEmailSettings(@RequestBody request: ExchangeTokenRequest): ResponseEntity<EmailSettingsResponse> {
        val userId = currentUserId()
        if (repo.existsById(userId)) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Email settings already exist")
        }

        val formData = LinkedMultiValueMap<String, String>().apply {
            add("code", request.code)
            add("client_id", clientId)
            add("client_secret", clientSecret)
            add("redirect_uri", request.redirectUri)
            add("grant_type", "authorization_code")
            add("code_verifier", request.codeVerifier)
        }
        val formHeaders = HttpHeaders().apply { contentType = MediaType.APPLICATION_FORM_URLENCODED }
        @Suppress("UNCHECKED_CAST")
        val tokenResponse = restTemplate.postForObject(
            "https://oauth2.googleapis.com/token",
            HttpEntity(formData, formHeaders),
            Map::class.java,
        ) as? Map<String, Any> ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to exchange token")

        val accessToken = tokenResponse["access_token"] as? String
            ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "Missing access_token")
        val refreshToken = tokenResponse["refresh_token"] as? String
            ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "Missing refresh_token")
        val expiresIn = (tokenResponse["expires_in"] as? Int)?.toLong() ?: 3600L
        val idToken = tokenResponse["id_token"] as? String
            ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "Missing id_token")

        val email = extractEmailFromIdToken(idToken)
            ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "Missing email in id_token")

        val saved = repo.save(
            EmailSettings(
                userId = userId,
                email = email,
                tokenExpiry = Instant.now().plusSeconds(expiresIn),
                accessToken = tokenEncryption.encrypt(accessToken),
                refreshToken = tokenEncryption.encrypt(refreshToken),
            )
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(saved.toResponse())
    }

    @PatchMapping
    @Transactional
    fun updateEmailSettings(@RequestBody request: PatchEmailSettingsRequest): EmailSettingsResponse {
        val userId = currentUserId()
        val existing = repo.findById(userId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        val updated = repo.save(
            EmailSettings(
                userId = existing.userId,
                email = existing.email,
                label = request.label,
                tokenExpiry = existing.tokenExpiry,
                accessToken = existing.accessToken,
                refreshToken = existing.refreshToken,
                createdAt = existing.createdAt,
                updatedAt = Instant.now(),
            )
        )
        return updated.toResponse()
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    fun deleteEmailSettings() {
        val userId = currentUserId()
        val existing = repo.findById(userId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        runCatching {
            val decryptedToken = tokenEncryption.decrypt(existing.accessToken)
            restTemplate.getForObject(
                "https://oauth2.googleapis.com/revoke?token=$decryptedToken",
                String::class.java,
            )
        }
        repo.deleteById(userId)
    }

    private fun extractEmailFromIdToken(idToken: String): String? {
        val payload = idToken.split(".").getOrNull(1) ?: return null
        val json = String(java.util.Base64.getUrlDecoder().decode(payload.padEnd((payload.length + 3) / 4 * 4, '=')))
        @Suppress("UNCHECKED_CAST")
        val claims = runCatching {
            org.springframework.boot.json.BasicJsonParser().parseMap(json) as Map<String, Any>
        }.getOrNull() ?: return null
        return claims["email"] as? String
    }

    private fun EmailSettings.toResponse() = EmailSettingsResponse(email = email, label = label)
}
