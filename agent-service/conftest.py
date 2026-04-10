"""Auto-generate gRPC stubs from proto/agent_service.proto before any pytest run."""
import subprocess
import sys
from pathlib import Path


def pytest_configure(config):
    proto_dir = Path(__file__).parent.parent / "proto"
    out_dir = Path(__file__).parent
    subprocess.run(
        [
            sys.executable, "-m", "grpc_tools.protoc",
            f"-I{proto_dir}",
            f"--python_out={out_dir}",
            f"--grpc_python_out={out_dir}",
            str(proto_dir / "agent_service.proto"),
        ],
        check=True,
    )
