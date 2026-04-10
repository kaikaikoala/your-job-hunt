"""
Tests for the gRPC servicer.
conftest.py auto-generates agent_service_pb2 stubs before these run.
"""
from unittest.mock import MagicMock

import agent_service_pb2
from main import AgentServiceServicer


def test_invoke_returns_hello_world():
    """InvokeHuntAgent returns the stub response for any input."""
    svc = AgentServiceServicer()
    request = agent_service_pb2.HuntInvokeRequest(sid="session-1", message="hello", uid="user-123")
    response = svc.InvokeHuntAgent(request, MagicMock())
    assert response.response == "Hello, world!"


def test_invoke_accepts_any_uid():
    """UID field is passed through without validation (auth is the web service's responsibility)."""
    svc = AgentServiceServicer()
    request = agent_service_pb2.HuntInvokeRequest(sid="s", message="test", uid="any-uid")
    response = svc.InvokeHuntAgent(request, MagicMock())
    assert response.response == "Hello, world!"
