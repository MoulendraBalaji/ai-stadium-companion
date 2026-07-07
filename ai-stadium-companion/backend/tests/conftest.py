from unittest.mock import patch

import pytest


@pytest.fixture(autouse=True)
def mock_ai_service_env():
    """
    Force MOCK_MODE = True and intercept all LLM calls to prevent network access.
    """
    with patch("app.ai_service.MOCK_MODE", True):
        yield
