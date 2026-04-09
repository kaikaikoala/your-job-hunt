package com.jobhunt

import jakarta.transaction.Transactional
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.data.domain.PageRequest
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

data class PatchApplicationRequest(
    val company: String? = null,
    val role: String? = null,
    val jobPostingUrl: String? = null,
    val salaryRange: String? = null,
    val referrerId: String? = null,
    val clearReferrer: Boolean = false,
)

data class CreateApplicationRequest(
    val company: String,
    val role: String,
    val jobPostingUrl: String? = null,
    val salaryRange: String? = null,
    val initialStage: String? = null,
    val stageDate: String? = null,
    val referrerId: String? = null,
)

data class LatestStageResponse(
    val stage: String,
    val stageDate: String?,
    val result: String?,
)

data class ApplicationResponse(
    val appId: String,
    val company: String,
    val role: String,
    val jobPostingUrl: String?,
    val salaryRange: String?,
    val referrerId: String?,
    val latestStage: LatestStageResponse? = null,
)

data class ApplicationWithStagesResponse(
    val appId: String,
    val company: String,
    val role: String,
    val jobPostingUrl: String?,
    val salaryRange: String?,
    val referrerId: String?,
    val latestStage: LatestStageResponse?,
    val stages: List<StageResponse>,
)

data class DashboardResponse(
    val applications: List<ApplicationWithStagesResponse>,
)

@RestController
@RequestMapping("/applications")
class ApplicationController(
    private val repo: ApplicationRepository,
    private val stageRepo: ApplicationStageRepository,
    private val actionItemRepo: ActionItemRepository,
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    fun createApplication(@RequestBody request: CreateApplicationRequest): ApplicationResponse {
        val uid = SecurityContextHolder.getContext().authentication.name
        val entity = JobApplication(
            userId = uid,
            company = request.company,
            role = request.role,
            jobPostingUrl = request.jobPostingUrl,
            salaryRange = request.salaryRange,
            referrerId = request.referrerId?.let { runCatching { UUID.fromString(it) }.getOrNull() },
        )
        val saved = try {
            repo.save(entity)
        } catch (ex: DataIntegrityViolationException) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Application with this URL already exists")
        }
        var latestStage: LatestStageResponse? = null
        if (request.initialStage != null) {
            val parsedDate = request.stageDate?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
            val stage = stageRepo.save(ApplicationStage(appId = saved.appId, stage = request.initialStage, stageDate = parsedDate))
            latestStage = stage.toLatestStageResponse()
        }
        return saved.toResponse(latestStage)
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun listApplications(): List<ApplicationResponse> {
        val uid = SecurityContextHolder.getContext().authentication.name
        return repo.findAllByUserId(uid).map { app ->
            val latest = stageRepo.findLatestByAppId(app.appId, PageRequest.of(0, 1)).firstOrNull()
            app.toResponse(latest?.toLatestStageResponse())
        }
    }

    @GetMapping("/dashboard")
    @ResponseStatus(HttpStatus.OK)
    fun getDashboard(): DashboardResponse {
        val uid = SecurityContextHolder.getContext().authentication.name
        val apps = repo.findAllByUserId(uid).map { app ->
            val allStages = stageRepo.findAllByAppId(app.appId)
            val latest = allStages
                .sortedWith(compareByDescending<ApplicationStage> { it.stageDate }.thenByDescending { it.createdAt })
                .firstOrNull()
            ApplicationWithStagesResponse(
                appId = app.appId.toString(),
                company = app.company,
                role = app.role,
                jobPostingUrl = app.jobPostingUrl,
                salaryRange = app.salaryRange,
                referrerId = app.referrerId?.toString(),
                latestStage = latest?.toLatestStageResponse(),
                stages = allStages.map { it.toDashboardStageResponse() },
            )
        }
        return DashboardResponse(applications = apps)
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun getApplication(@PathVariable id: String): ApplicationResponse {
        val uid = SecurityContextHolder.getContext().authentication.name
        val appId = runCatching { UUID.fromString(id) }.getOrElse {
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        val app = repo.findByAppIdAndUserId(appId, uid)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        val latest = stageRepo.findLatestByAppId(app.appId, PageRequest.of(0, 1)).firstOrNull()
        return app.toResponse(latest?.toLatestStageResponse())
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun updateApplication(
        @PathVariable id: String,
        @RequestBody request: PatchApplicationRequest,
    ): ApplicationResponse {
        val uid = SecurityContextHolder.getContext().authentication.name
        val appId = runCatching { UUID.fromString(id) }.getOrElse {
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        val existing = repo.findByAppIdAndUserId(appId, uid)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        val newReferrerId = when {
            request.clearReferrer -> null
            request.referrerId != null -> runCatching { UUID.fromString(request.referrerId) }.getOrNull()
            else -> existing.referrerId
        }
        val updated = repo.save(
            JobApplication(
                appId = existing.appId,
                userId = existing.userId,
                company = request.company ?: existing.company,
                role = request.role ?: existing.role,
                jobPostingUrl = if (request.jobPostingUrl != null) request.jobPostingUrl.ifBlank { null } else existing.jobPostingUrl,
                salaryRange = if (request.salaryRange != null) request.salaryRange.ifBlank { null } else existing.salaryRange,
                referrerId = newReferrerId,
            )
        )
        val latest = stageRepo.findLatestByAppId(updated.appId, org.springframework.data.domain.PageRequest.of(0, 1)).firstOrNull()
        return updated.toResponse(latest?.toLatestStageResponse())
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteApplication(@PathVariable id: String) {
        val uid = SecurityContextHolder.getContext().authentication.name
        val appId = runCatching { UUID.fromString(id) }.getOrElse {
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        repo.findByAppIdAndUserId(appId, uid)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        val actionItemCount = actionItemRepo.countByAppId(appId)
        if (actionItemCount > 0) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete application with active action items")
        }
        repo.deleteById(appId)
    }

    private fun ApplicationStage.toLatestStageResponse() = LatestStageResponse(
        stage = stage,
        stageDate = stageDate?.toString(),
        result = result,
    )

    private fun ApplicationStage.toDashboardStageResponse() = StageResponse(
        appStageId = appStageId.toString(),
        appId = appId.toString(),
        stage = stage,
        stageDate = stageDate?.toString(),
        result = result,
        createdAt = createdAt.toString(),
    )

    private fun JobApplication.toResponse(latestStage: LatestStageResponse? = null) = ApplicationResponse(
        appId = appId.toString(),
        company = company,
        role = role,
        jobPostingUrl = jobPostingUrl,
        salaryRange = salaryRange,
        referrerId = referrerId?.toString(),
        latestStage = latestStage,
    )
}
