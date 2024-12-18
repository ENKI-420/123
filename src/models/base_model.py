from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from dataclasses import dataclass

@dataclass
class ModelResponse:
    """Container for model outputs with metadata."""
    content: Any
    confidence: float
    metadata: Dict[str, Any]

class BaseModel(ABC):
    """Abstract base class defining the interface for AI model implementations."""
    
    def __init__(self, model_id: str, capabilities: Dict[str, float]):
        """Initialize a new AI model instance.
        
        Args:
            model_id: Unique identifier for this model instance
            capabilities: Dict mapping capability names to confidence scores (0-1)
        """
        self.model_id = model_id
        self.capabilities = capabilities
        self._is_ready = False
        
    @property
    def is_ready(self) -> bool:
        """Check if model is initialized and ready to handle requests."""
        return self._is_ready
        
    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize model resources and connections.
        
        Returns:
            bool: True if initialization successful
        """
        pass
        
    @abstractmethod
    async def process(self, input_data: Dict[str, Any]) -> ModelResponse:
        """Process the input data and return results.
        
        Args:
            input_data: Dictionary containing input data and parameters
            
        Returns:
            ModelResponse containing output and metadata
        """
        pass
        
    @abstractmethod
    async def evaluate(self, input_data: Dict[str, Any], 
                    response: ModelResponse) -> float:
        """Evaluate quality of model's response for given input.
        
        Args:
            input_data: Original input that generated the response
            response: Response to evaluate
            
        Returns:
            float: Quality score between 0-1
        """
        pass
        
    @abstractmethod
    async def shutdown(self) -> None:
        """Clean up model resources."""
        pass

