from typing import Any, Dict
from ..base_model import BaseModel, ModelResponse
import os
import openai

class ChatGPTModel(BaseModel):
    def __init__(self):
        capabilities = {
            "text_generation": 0.9,
            "code_generation": 0.85,
            "conversation": 0.95
        }
        super().__init__("chatgpt", capabilities)
        self.api_key = os.getenv("OPENAI_API_KEY")

    async def initialize(self) -> bool:
        if not self.api_key:
            return False
        openai.api_key = self.api_key
        self._is_ready = True
        return True

    async def process(self, input_data: Dict[str, Any]) -> ModelResponse:
        if not self.is_ready:
            raise RuntimeError("Model not initialized")
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": input_data["message"]}]
            )
            return ModelResponse(
                content=response.choices[0].message.content,
                confidence=response.choices[0].finish_reason == "stop" and 0.9 or 0.5,
                metadata={"model": "gpt-3.5-turbo", "usage": response.usage}
            )
        except Exception as e:
            raise RuntimeError(f"Error processing request: {str(e)}")

    async def evaluate(self, input_data: Dict[str, Any], response: ModelResponse) -> float:
        # Implement basic evaluation logic
        if response.content and len(response.content) > 0:
            return response.confidence
        return 0.0

    async def shutdown(self) -> None:
        self._is_ready = False
