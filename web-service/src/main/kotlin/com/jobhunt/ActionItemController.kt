package com.jobhunt

import org.springframework.http.HttpStatus
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDate
import java.util.UUID

data class CreateActionItemRequest(
    val description: String,
    val appId: String? = null,
    val referrerId: String? = null,
    val dueDate: String? = null,
)

data class PatchActionItemRequest(
    val description: String? = null,
    val status: String? = null,
    val dueDate: String? = null,
)

data class ActionItemResponse(
    val actionItemId: String,
    val userId: String,
    val appId: String?,
    val referrerId: String?,
    val description: String,
    val status: String,
    val dueDate: String?,
    val createDate: String,
)

@RestController
@RequestMapping("/action-items")
class ActionItemController(
    private val repo: ActionItemRepository,
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: CreateActionItemRequest): ActionItemResponse {
        val uid = uid()
        val parsedAppId = request.appId?.let { runCatching { UUID.fromString(it) }.getOrNull() }
        val parsedReferrerId = request.referrerId?.let { runCatching { UUID.fromString(it) }.getOrNull() }
        val parsedDueDate = request.dueDate?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
        val item = repo.save(
            ActionItem(
                userId = uid,
                appId = parsedAppId,
                referrerId = parsedReferrerId,
                description = request.description,
                dueDate = parsedDueDate,
            )
        )
        return item.toResponse()
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun list(
        @RequestParam appId: String? = null,
        @RequestParam referrerId: String? = null,
        @RequestParam status: String? = null,
    ): List<ActionItemResponse> {
        val uid = uid()
        val parsedAppId = appId?.let { runCatching { UUID.fromString(it) }.getOrNull() }
        val parsedReferrerId = referrerId?.let { runCatching { UUID.fromString(it) }.getOrNull() }
        return repo.findAllByUserId(uid)
            .filter { item -> parsedAppId == null || item.appId == parsedAppId }
            .filter { item -> parsedReferrerId == null || item.referrerId == parsedReferrerId }
            .filter { item -> status == null || item.status == status }
            .sortedByDescending { it.createDate }
            .map { it.toResponse() }
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun update(
        @PathVariable id: String,
        @RequestBody request: PatchActionItemRequest,
    ): ActionItemResponse {
        val uid = uid()
        val uuid = runCatching { UUID.fromString(id) }.getOrElse {
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        val existing = repo.findById(uuid).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        if (existing.userId != uid) throw ResponseStatusException(HttpStatus.NOT_FOUND)

        val parsedDueDate = if (request.dueDate != null)
            runCatching { LocalDate.parse(request.dueDate) }.getOrNull()
        else
            existing.dueDate

        val updated = repo.save(
            ActionItem(
                actionItemId = existing.actionItemId,
                userId = existing.userId,
                appId = existing.appId,
                referrerId = existing.referrerId,
                description = request.description ?: existing.description,
                status = request.status ?: existing.status,
                dueDate = parsedDueDate,
                createDate = existing.createDate,
            )
        )
        return updated.toResponse()
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: String) {
        val uid = uid()
        val uuid = runCatching { UUID.fromString(id) }.getOrElse {
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        val existing = repo.findById(uuid).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        if (existing.userId != uid) throw ResponseStatusException(HttpStatus.NOT_FOUND)
        repo.delete(existing)
    }

    private fun uid() = SecurityContextHolder.getContext().authentication.name

    private fun ActionItem.toResponse() = ActionItemResponse(
        actionItemId = actionItemId.toString(),
        userId = userId,
        appId = appId?.toString(),
        referrerId = referrerId?.toString(),
        description = description,
        status = status,
        dueDate = dueDate?.toString(),
        createDate = createDate.toString(),
    )
}
