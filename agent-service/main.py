import grpc
from concurrent import futures

import agent_service_pb2
import agent_service_pb2_grpc


class AgentServiceServicer(agent_service_pb2_grpc.AgentServiceServicer):
    def InvokeHuntAgent(self, request, context):
        # TODO Sub-task 2: wire to LangChain ReAct hunt agent
        # request.sid, request.message, request.uid are available
        return agent_service_pb2.HuntInvokeResponse(response="Hello, world!")

    # TODO Phase 3: implement resume agent RPCs here


def serve() -> None:
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    agent_service_pb2_grpc.add_AgentServiceServicer_to_server(AgentServiceServicer(), server)
    server.add_insecure_port("[::]:50051")
    server.start()
    print("Agent service listening on :50051")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
