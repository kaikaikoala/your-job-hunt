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
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDate
import java.util.UUID

data class CreateStageRequest(
    val stage: String,
    val stageDate: String? = null,
    val result: String? = null,
)

data class PatchStageRequest(
    val stage: String? = null,
    val stageDate: String? = null,
    val result: String? = null,
)

data class StageResponse(
    val appStageId: String,
    val appId: String,
    val stage: String,
    val stageDate: String?,
    val result: String?,
)

@RestController
@RequestMapping("/applications/{appId}/stages")
class StageController(
    private val appRepo: ApplicationRepository,
    private val stageRepo: ApplicationStageRepository,
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createStage(
        @PathVariable appId: String,
        @RequestBody request: CreateStageRequest,
    ): StageResponse {
        val app = resolveApp(appId)
        val parsedDate = request.stageDate?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
        val stage = stageRepo.save(
            ApplicationStage(appId = app.appId, stage = request.stage, stageDate = parsedDate, result = request.result)
        )
        return stage.toResponse()
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun listStages(@PathVariable appId: String): List<StageResponse> {
        val app = resolveApp(appId)
        return stageRepo.findAllByAppId(app.appId)
            .sortedWith(compareBy(nullsLast()) { it.stageDate })
            .map { it.toResponse() }
    }

    @PatchMapping("/{stageId}")
    @ResponseStatus(HttpStatus.OK)
    fun updateStage(
        @PathVariable appId: String,
        @PathVariable stageId: String,
        @RequestBody request: PatchStageRequest,
    ): StageResponse {
        val app = resolveApp(appId)
        val stageUuid = runCatching { UUID.fromString(stageId) }.getOrElse {
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        val existing = stageRepo.findById(stageUuid).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        if (existing.appId != app.appId) throw ResponseStatusException(HttpStatus.NOT_FOUND)

        val parsedDate = if (request.stageDate != null)
            runCatching { LocalDate.parse(request.stageDate) }.getOrNull()
        else
            existing.stageDate

        val updated = stageRepo.save(
            ApplicationStage(
                appStageId = existing.appStageId,
                appId = existing.appId,
                stage = request.stage ?: existing.stage,
                stageDate = parsedDate,
                result = if (request.result != null) request.result else existing.result,
            )
        )
        return updated.toResponse()
    }

    @DeleteMapping("/{stageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteStage(@PathVariable appId: String, @PathVariable stageId: String) {
        val app = resolveApp(appId)
        val stageUuid = runCatching { UUID.fromString(stageId) }.getOrElse {
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        val existing = stageRepo.findById(stageUuid).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        if (existing.appId != app.appId) throw ResponseStatusException(HttpStatus.NOT_FOUND)
        stageRepo.delete(existing)
    }

    private fun resolveApp(appId: String): JobApplication {
        val uid = SecurityContextHolder.getContext().authentication.name
        val uuid = runCatching { UUID.fromString(appId) }.getOrElse {
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        return appRepo.findByAppIdAndUserId(uuid, uid)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
    }

    private fun ApplicationStage.toResponse() = StageResponse(
        appStageId = appStageId.toString(),
        appId = appId.toString(),
        stage = stage,
        stageDate = stageDate?.toString(),
        result = result,
    )
}
