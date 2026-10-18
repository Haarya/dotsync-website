from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .device.base import DeviceClient, DeviceStatus, PracticeResult
from .device.mock import MockDeviceClient
from .schemas import HealthResponse, PracticeRequest

app = FastAPI(
    title="DotSync Local API",
    version="0.1.0",
    description="Local Phase 1 API. Device operations currently use a safe simulator.",
)
device: DeviceClient = MockDeviceClient()


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    _request: Request, error: RequestValidationError
) -> JSONResponse:
    text_field_error = any(
        validation_error.get("loc")
        and validation_error["loc"][-1] == "text"
        for validation_error in error.errors()
    )
    if text_field_error:
        return JSONResponse(
            status_code=422,
            content={
                "code": "UNSUPPORTED_INPUT",
                "message": "Use 1-40 English letters A-Z and spaces only.",
            },
        )
    return JSONResponse(
        status_code=422,
        content={"code": "INVALID_REQUEST", "message": "Check the request and try again."},
    )


@app.get("/api/v1/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse()


@app.get("/api/v1/device/status", response_model=DeviceStatus)
async def device_status() -> DeviceStatus:
    return await device.get_status()


@app.post("/api/v1/practice", response_model=PracticeResult)
async def practice(request: PracticeRequest) -> PracticeResult:
    return await device.practice_text(request.text)
