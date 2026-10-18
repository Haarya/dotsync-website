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


class WordSessionRequest(BaseModel):
    word: str = Field(min_length=2, max_length=8)

    @field_validator("word")
    @classmethod
    def normalize_word(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not re.fullmatch(r"[A-Z]{2,8}", normalized):
            raise ValueError("Choose a word with 2-8 English letters A-Z and no spaces.")
        return normalized


class WordAnswerRequest(BaseModel):
    answer: str = Field(default="", max_length=40)

    @field_validator("answer")
    @classmethod
    def normalize_answer(cls, value: str) -> str:
        return re.sub(r"[^A-Z]", "", value.strip().upper())
