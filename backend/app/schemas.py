import re

from pydantic import BaseModel, Field, field_validator


class HealthResponse(BaseModel):
    ok: bool = True
    service: str = "dotsync-local"


class PracticeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=40)

    @field_validator("text")
    @classmethod
    def normalize_supported_text(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not normalized:
            raise ValueError("Enter at least one letter to begin.")
        if not re.fullmatch(r"[A-Z ]+", normalized):
            raise ValueError("For this first version, use English letters A-Z and spaces only.")
        return normalized
