package com.jobhunt

import jakarta.transaction.Transactional
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDate

data class CreateApplicationRequest(
    val company: String,
    val role: String,
    val jobPostingUrl: String? = null,
    val salaryRange: String? = null,
    val initialStage: String? = null,
    val stageDate: String? = null,
)

data class ApplicationResponse(
    val appId: String,
    val company: String,
    val role: String,
    val jobPostingUrl: String?,
    val salaryRange: String?,
)

@RestController
@RequestMapping("/applications")
class ApplicationController(
    private val repo: ApplicationRepository,
    private val stageRepo: ApplicationStageRepository,
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
        )
        val saved = try {
            repo.save(entity)
        } catch (ex: DataIntegrityViolationException) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Application with this URL already exists")
        }
        if (request.initialStage != null) {
            val parsedDate = request.stageDate?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
            stageRepo.save(ApplicationStage(appId = saved.appId, stage = request.initialStage, stageDate = parsedDate))
        }
        return saved.toResponse()
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun listApplications(): List<ApplicationResponse> {
        val uid = SecurityContextHolder.getContext().authentication.name
        return repo.findAllByUserId(uid).map { it.toResponse() }
    }

    private fun JobApplication.toResponse() = ApplicationResponse(
        appId = appId.toString(),
        company = company,
        role = role,
        jobPostingUrl = jobPostingUrl,
        salaryRange = salaryRange,
    )
}
