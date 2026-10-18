import asyncio
from uuid import uuid4

from .base import DeviceStatus, PracticeAction


class DeviceBusyError(Exception):
    pass


class MockDeviceClient:
    """Safe Phase 1 substitute: accepts practice input without contacting hardware."""

    def __init__(self) -> None:
        self._actions: dict[str, PracticeAction] = {}
        self._tasks: dict[str, asyncio.Task[None]] = {}
        self._lock = asyncio.Lock()
        self._active_action_id: str | None = None

    async def get_status(self) -> DeviceStatus:
        return DeviceStatus(
            mode="mock",
            connected=True,
            busy=self._active_action_id is not None,
            message="Simulation is ready. No ESP32 commands are sent.",
        )

    async def start_practice(self, text: str) -> PracticeAction:
        action_id = str(uuid4())
        action = PracticeAction(
            action_id=action_id,
            state="queued",
            text=text,
            character_count=len(text),
            current_index=0,
            message="Practice queued in simulation. No ESP32 commands are sent.",
        )
        async with self._lock:
            if self._active_action_id is not None:
                current = self._actions.get(self._active_action_id)
                if current and current.state in {"queued", "running"}:
                    raise DeviceBusyError("The board is busy. Wait for the current practice to finish or stop it.")
            self._actions[action_id] = action
            self._active_action_id = action_id
            self._tasks[action_id] = asyncio.create_task(self._run_practice(action_id))
        return action

    async def get_action(self, action_id: str) -> PracticeAction | None:
        return self._actions.get(action_id)

    async def cancel_action(self, action_id: str) -> PracticeAction | None:
        action = self._actions.get(action_id)
        if not action or action.state in {"completed", "cancelled", "failed"}:
            return action
        task = self._tasks.get(action_id)
        if task and not task.done():
            task.cancel()
        cancelled = action.model_copy(update={
            "state": "cancelled",
            "message": "Practice stopped. No board movement occurred.",
        })
        self._actions[action_id] = cancelled
        if self._active_action_id == action_id:
            self._active_action_id = None
        return cancelled

    async def reset(self) -> None:
        for action_id, action in tuple(self._actions.items()):
            if action.state in {"queued", "running"}:
                await self.cancel_action(action_id)

    async def _run_practice(self, action_id: str) -> None:
        action = self._actions[action_id]
        try:
            for index, character in enumerate(action.text, start=1):
                await asyncio.sleep(0.55)
                current = self._actions[action_id]
                if current.state == "cancelled":
                    return
                self._actions[action_id] = current.model_copy(update={
                    "state": "running",
                    "current_index": index,
                    "current_character": character,
                    "message": f"Simulation showing character {index} of {len(action.text)}. No board movement occurred.",
                })
            current = self._actions[action_id]
            self._actions[action_id] = current.model_copy(update={
                "state": "completed",
                "message": f"Simulation completed {len(action.text)} characters. No board movement occurred.",
            })
            self._active_action_id = None
        except asyncio.CancelledError:
            return
