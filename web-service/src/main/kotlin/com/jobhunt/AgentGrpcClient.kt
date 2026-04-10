package com.jobhunt

import com.jobhunt.grpc.agent.AgentServiceGrpc
import com.jobhunt.grpc.agent.HuntInvokeRequest
import io.grpc.ManagedChannelBuilder
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class AgentGrpcClient(
    @Value("\${agent.grpc.host:localhost}") host: String,
    @Value("\${agent.grpc.port:50051}") port: Int,
) {
    private val stub = AgentServiceGrpc.newBlockingStub(
        ManagedChannelBuilder.forAddress(host, port).usePlaintext().build()
    )

    fun invokeHuntAgent(sid: String, message: String, uid: String): String =
        stub.invokeHuntAgent(
            HuntInvokeRequest.newBuilder()
                .setSid(sid)
                .setMessage(message)
                .setUid(uid)
                .build()
        ).response
}
