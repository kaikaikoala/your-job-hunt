package com.jobhunt

import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

private val logger = LoggerFactory.getLogger(AgentController::class.java)

@RestController
@RequestMapping("/agents")
class AgentController(private val agentGrpcClient: AgentGrpcClient) {

    data class InvokeRequest(val message: String)
    data class InvokeResponse(val response: String)

    @PostMapping("/hunt/{appId}/invoke")
    fun invokeHuntAgent(
        @PathVariable appId: String,
        @RequestBody body: InvokeRequest,
        authentication: Authentication,
        httpRequest: HttpServletRequest,
    ): InvokeResponse {
        val token = httpRequest.getHeader("Authorization")?.removePrefix("Bearer ") ?: ""
        logger.info("AgentController.invokeHuntAgent: appId={}, uid={}", appId, authentication.name)
        val response = agentGrpcClient.invokeHuntAgent(appId, body.message, authentication.name, token)
        return InvokeResponse(response)
    }
}
