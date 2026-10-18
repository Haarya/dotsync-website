from uuid import uuid4

from .base import DeviceStatus, PracticeResult


class MockDeviceClient:
    """Safe Phase 1 substitute: accepts practice input without contacting hardware."""

    async def get_status(self) -> DeviceStatus:
        return DeviceStatus(
            mode="mock",
            connected=True,
            busy=False,
            message="Simulation is ready. No ESP32 commands are sent.",
        )

    async def practice_text(self, text: str) -> PracticeResult:
        return PracticeResult(
            action_id=str(uuid4()),
            state="simulated",
            character_count=len(text),
            message=f"{len(text)} characters were accepted by the simulation. No board movement occurred.",
        )
