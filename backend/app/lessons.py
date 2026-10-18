from typing import Literal
from uuid import uuid4

from pydantic import BaseModel


BRAILLE_DOTS: dict[str, list[int]] = {
    "A": [1], "B": [1, 2], "C": [1, 4], "D": [1, 4, 5], "E": [1, 5],
    "F": [1, 2, 4], "G": [1, 2, 4, 5], "H": [1, 2, 5], "I": [2, 4],
    "J": [2, 4, 5], "K": [1, 3], "L": [1, 2, 3], "M": [1, 3, 4],
    "N": [1, 3, 4, 5], "O": [1, 3, 5], "P": [1, 2, 3, 4],
    "Q": [1, 2, 3, 4, 5], "R": [1, 2, 3, 5], "S": [2, 3, 4],
    "T": [2, 3, 4, 5], "U": [1, 3, 6], "V": [1, 2, 3, 6],
    "W": [2, 4, 5, 6], "X": [1, 3, 4, 6], "Y": [1, 3, 4, 5, 6],
    "Z": [1, 3, 5, 6],
}


class WordSessionView(BaseModel):
    session_id: str
    state: Literal["waiting_for_answer", "feedback", "completed", "cancelled"]
    item_index: int
    item_count: int
    current_dots: list[int]
    outcome: Literal["correct", "retry", "uncertain"] | None = None
    feedback: str


class _WordSession(BaseModel):
    session_id: str
    expected_word: str
    item_index: int = 0
    state: Literal["waiting_for_answer", "feedback", "completed", "cancelled"] = "waiting_for_answer"
    outcome: Literal["correct", "retry", "uncertain"] | None = None
    feedback: str = "The first Braille pattern is ready."


class WordSessionStore:
    """In-memory word-session controller used while the site runs without hardware."""

    def __init__(self) -> None:
        self._sessions: dict[str, _WordSession] = {}

    def create(self, word: str) -> WordSessionView:
        session_id = str(uuid4())
        session = _WordSession(session_id=session_id, expected_word=word)
        self._sessions[session_id] = session
        return self._view(session)

    def get(self, session_id: str) -> WordSessionView | None:
        session = self._sessions.get(session_id)
        return self._view(session) if session else None

    def advance(self, session_id: str) -> WordSessionView | None:
        session = self._sessions.get(session_id)
        if not session:
            return None
        if session.state == "cancelled" or session.state == "completed":
            return self._view(session)
        if session.item_index < len(session.expected_word) - 1:
            updated = session.model_copy(update={
                "item_index": session.item_index + 1,
                "state": "waiting_for_answer",
                "outcome": None,
                "feedback": "Next Braille pattern is ready.",
            })
        else:
            updated = session.model_copy(update={
                "state": "feedback",
                "feedback": "You have felt every letter. Try saying the whole word.",
            })
        self._sessions[session_id] = updated
        return self._view(updated)

    def evaluate(self, session_id: str, answer: str) -> WordSessionView | None:
        session = self._sessions.get(session_id)
        if not session:
            return None
        if session.state in {"completed", "cancelled"}:
            return self._view(session)
        if session.item_index < len(session.expected_word) - 1:
            updated = session.model_copy(update={
                "state": "feedback",
                "outcome": "uncertain",
                "feedback": "Feel each letter first. Then try saying the whole word.",
            })
        elif not answer:
            updated = session.model_copy(update={
                "state": "feedback",
                "outcome": "uncertain",
                "feedback": "I could not check an empty answer. Try again or ask a grown-up for help.",
            })
        elif answer == session.expected_word:
            updated = session.model_copy(update={
                "state": "completed",
                "outcome": "correct",
                "feedback": "That is right. You read the word!",
            })
        else:
            updated = session.model_copy(update={
                "state": "waiting_for_answer",
                "outcome": "retry",
                "feedback": "Good try. Take another moment with the letters, then try again.",
            })
        self._sessions[session_id] = updated
        return self._view(updated)

    def cancel(self, session_id: str) -> WordSessionView | None:
        session = self._sessions.get(session_id)
        if not session:
            return None
        updated = session.model_copy(update={"state": "cancelled", "feedback": "Word journey paused."})
        self._sessions[session_id] = updated
        return self._view(updated)

    @staticmethod
    def _view(session: _WordSession) -> WordSessionView:
        letter = session.expected_word[session.item_index]
        return WordSessionView(
            session_id=session.session_id,
            state=session.state,
            item_index=session.item_index,
            item_count=len(session.expected_word),
            current_dots=BRAILLE_DOTS[letter],
            outcome=session.outcome,
            feedback=session.feedback,
        )


word_sessions = WordSessionStore()
