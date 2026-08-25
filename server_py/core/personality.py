# This file is a compatibility shim. All personality constants live in server_py/eleonor/personality.py.
# Do NOT add logic here. Modify server_py/eleonor/personality.py instead.
from server_py.eleonor.personality import (
    ELEONOR_CORE_RUNTIME,
    ELEONOR_CORE_FULL,
    get_system_prompt,
    MODE,
)

__all__ = ["ELEONOR_CORE_RUNTIME", "ELEONOR_CORE_FULL", "get_system_prompt", "MODE"]