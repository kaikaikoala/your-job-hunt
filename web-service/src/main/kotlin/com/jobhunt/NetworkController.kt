package com.jobhunt

import org.springframework.http.HttpStatus
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

data class CreateNetworkContactRequest(
    val name: String,
    val type: String? = null,
)

data class NetworkContactResponse(
    val referrerId: String,
    val name: String,
    val type: String?,
    val linkedAppCount: Int,
)

@RestController
@RequestMapping("/network")
class NetworkController(
    private val repo: NetworkRepository,
    private val appRepo: ApplicationRepository,
    private val actionItemRepo: ActionItemRepository,
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createContact(@RequestBody request: CreateNetworkContactRequest): NetworkContactResponse {
        val uid = SecurityContextHolder.getContext().authentication.name
        val entity = NetworkContact(userId = uid, name = request.name, type = request.type)
        val saved = repo.save(entity)
        return saved.toResponse(0)
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun listContacts(): List<NetworkContactResponse> {
        val uid = SecurityContextHolder.getContext().authentication.name
        return repo.findAllByUserId(uid).map { contact ->
            val count = appRepo.countByReferrerIdAndUserId(contact.referrerId, uid)
            contact.toResponse(count)
        }
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun updateContact(
        @PathVariable id: String,
        @RequestBody request: CreateNetworkContactRequest,
    ): NetworkContactResponse {
        val uid = SecurityContextHolder.getContext().authentication.name
        val referrerId = runCatching { UUID.fromString(id) }.getOrElse {
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        val existing = repo.findByReferrerIdAndUserId(referrerId, uid)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        val updated = NetworkContact(
            referrerId = existing.referrerId,
            userId = existing.userId,
            name = request.name,
            type = request.type,
        )
        val saved = repo.save(updated)
        val count = appRepo.countByReferrerIdAndUserId(saved.referrerId, uid)
        return saved.toResponse(count)
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteContact(@PathVariable id: String) {
        val uid = SecurityContextHolder.getContext().authentication.name
        val referrerId = runCatching { UUID.fromString(id) }.getOrElse {
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        repo.findByReferrerIdAndUserId(referrerId, uid)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        val appCount = appRepo.countByReferrerIdAndUserId(referrerId, uid)
        val itemCount = actionItemRepo.countByReferrerId(referrerId)
        if (appCount > 0 || itemCount > 0) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Contact is in use")
        }
        repo.deleteById(referrerId)
    }

    private fun NetworkContact.toResponse(linkedAppCount: Int) = NetworkContactResponse(
        referrerId = referrerId.toString(),
        name = name,
        type = type,
        linkedAppCount = linkedAppCount,
    )
}
