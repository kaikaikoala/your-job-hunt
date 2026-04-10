package com.jobhunt

import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/agents")
class AgentController(private val agentGrpcClient: AgentGrpcClient) {

    data class InvokeRequest(val message: String)
    data class InvokeResponse(val response: String)

    @PostMapping("/hunt/{sid}/invoke")
    fun invokeHuntAgent(
        @PathVariable sid: String,
        @RequestBody body: InvokeRequest,
        authentication: Authentication,
    ): InvokeResponse {
        val response = agentGrpcClient.invokeHuntAgent(sid, body.message, authentication.name)
        return InvokeResponse(response)
    }
}
