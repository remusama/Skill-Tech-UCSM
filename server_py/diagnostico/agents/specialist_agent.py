from .base_agent import BaseAgent


class SpecialistAgent(BaseAgent):
    def __init__(self, name: str, persona: str):
        super().__init__()
        self.name = name
        self.persona = persona

    async def analyze(self, quiz_data: dict) -> dict:
        return await self._run_analysis(self.name, self.persona, quiz_data)
