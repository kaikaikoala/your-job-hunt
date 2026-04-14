package com.jobhunt

import com.jobhunt.grpc.agent.AgentServiceGrpc
import com.jobhunt.grpc.agent.HuntInvokeRequest
import io.grpc.ManagedChannelBuilder
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

private val logger = LoggerFactory.getLogger(AgentGrpcClient::class.java)

@Service
class AgentGrpcClient(
    @Value("\${agent.grpc.host:localhost}") host: String,
    @Value("\${agent.grpc.port:50051}") port: Int,
) {
    private val stub = AgentServiceGrpc.newBlockingStub(
        ManagedChannelBuilder.forAddress(host, port).usePlaintext().build()
    )

    fun invokeHuntAgent(appId: String, message: String, uid: String, token: String): String {
        logger.info("gRPC InvokeHuntAgent: appId={}", appId)
        val response = stub.invokeHuntAgent(
            HuntInvokeRequest.newBuilder()
                .setAppId(appId)
                .setMessage(message)
                .setUid(uid)
                .setToken(token)
                .build()
        ).response
        logger.info("gRPC InvokeHuntAgent completed: appId={}", appId)
        return response
    }
}
