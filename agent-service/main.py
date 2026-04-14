import grpc
import logging
from concurrent import futures

import agent_service_pb2
import agent_service_pb2_grpc
from hunt.update_app_chain import update_app_chain

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


class AgentServiceServicer(agent_service_pb2_grpc.AgentServiceServicer):
    def InvokeHuntAgent(self, request, context):
        logger.info("gRPC InvokeHuntAgent: app_id=%s, uid=%s", request.app_id, request.uid)
        response = update_app_chain.invoke({
            "app_id": request.app_id,
            "message": request.message,
            "uid": request.uid,
            "token": request.token,
        })
        return agent_service_pb2.HuntInvokeResponse(response=response)

    # TODO Phase 3: implement resume agent RPCs here


def serve() -> None:
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    agent_service_pb2_grpc.add_AgentServiceServicer_to_server(AgentServiceServicer(), server)
    server.add_insecure_port("[::]:50051")
    server.start()
    logger.info("Agent service listening on :50051")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
