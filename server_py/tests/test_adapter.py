"""Unit tests for the State Adapter (PR C) — verifies parity between DB and in-memory modes."""
import sys
import os
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))


EXPECTED_KEYS = {"valence", "tension", "engagement", "boundary"}


def _make_mock_session(**overrides):
    """Build a mock DB EleonorSession with defaults."""
    session = MagicMock()
    session.valence = overrides.get("valence", "neutra")
    session.tension = overrides.get("tension", 0.5)
    session.engagement = overrides.get("engagement", 0.5)
    session.boundary = overrides.get("boundary", "none")
    return session


class TestAdapterInMemoryMode:
    """Tests when ENABLE_DB_SESSION=False (default)."""

    def test_get_session_returns_expected_keys(self):
        with patch("server_py.config.settings.ENABLE_DB_SESSION", False):
            from server_py.memoria import state
            state.eleonor_state["valence"] = "positiva"
            state.eleonor_state["tension"] = 0.3
            state.eleonor_state["engagement"] = 0.7
            state.eleonor_boundary = "none"

            from server_py.memoria.adapter import get_session
            result = get_session(user_id=1)

            assert set(result.keys()) == EXPECTED_KEYS
            assert result["valence"] == "positiva"
            assert result["tension"] == 0.3
            assert result["engagement"] == 0.7

    def test_update_session_writes_to_memory(self):
        with patch("server_py.config.settings.ENABLE_DB_SESSION", False):
            from server_py.memoria.adapter import update_session, get_session
            update_session(user_id=1, updates={"valence": "negativa", "tension": 0.9})
            result = get_session(user_id=1)

            assert result["valence"] == "negativa"
            assert result["tension"] == 0.9


class TestAdapterDBMode:
    """Tests when ENABLE_DB_SESSION=True."""

    def test_get_session_db_returns_correct_shape(self):
        mock_db = MagicMock()
        mock_session = _make_mock_session(valence="positiva", tension=0.2, engagement=0.8)
        mock_db.query.return_value.filter.return_value.first.return_value = mock_session

        with patch("server_py.config.settings.ENABLE_DB_SESSION", True):
            from server_py.memoria.adapter import get_session
            result = get_session(user_id=42, db=mock_db)

        assert set(result.keys()) == EXPECTED_KEYS
        assert result["valence"] == "positiva"
        assert result["tension"] == 0.2

    def test_update_session_db_calls_commit(self):
        mock_db = MagicMock()
        mock_session = _make_mock_session()
        mock_db.query.return_value.filter.return_value.first.return_value = mock_session

        with patch("server_py.config.settings.ENABLE_DB_SESSION", True):
            from server_py.memoria.adapter import update_session
            update_session(user_id=42, updates={"valence": "negativa", "tension": 0.7}, db=mock_db)

        assert mock_db.commit.called
        assert mock_session.valence == "negativa"
        assert mock_session.tension == 0.7

    def test_get_session_db_fallback_on_error(self):
        """When DB raises, adapter must fall back to in-memory gracefully."""
        mock_db = MagicMock()
        mock_db.query.side_effect = RuntimeError("DB connection failed")

        with patch("server_py.config.settings.ENABLE_DB_SESSION", True):
            from server_py.memoria import state
            state.eleonor_state["valence"] = "neutra"
            from server_py.memoria.adapter import get_session
            result = get_session(user_id=99, db=mock_db)

        # Should not raise; returns in-memory fallback
        assert "valence" in result
