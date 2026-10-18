from typing import Literal, Protocol

from pydantic import BaseModel


class DeviceStatus(BaseModel):
    mode: Literal["mock"]
    connected: bool
    busy: bool
    message: str


class PracticeResult(BaseModel):
    action_id: str
    state: Literal["simulated"]
    character_count: int
    message: str


class DeviceClient(Protocol):
    async def get_status(self) -> DeviceStatus: ...

    async def practice_text(self, text: str) -> PracticeResult: ...
