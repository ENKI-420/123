from typing import Dict, List, Optional, Type
from src.models.base_model import BaseModel, ModelResponse

class TaskRouter:
    """Routes tasks to appropriate AI models based on capabilities and availability."""

    def __init__(self):
        """Initialize the task router."""
        self.registered_models: Dict[str, BaseModel] = {}
        self.task_types: Dict[str, List[str]] = {}
        
    def register_model(self, model: BaseModel) -> None:
        """Register a new AI model with the router.
        
        Args:
            model: BaseModel instance to register
        """
        self.registered_models[model.model_id] = model
        
    def register_task_type(self, task_type: str, required_capabilities: List[str]) -> None:
        """Register a new task type and its required capabilities.
        
        Args:
            task_type: String identifier for the task type
            required_capabilities: List of capability names needed for this task
        """
        self.task_types[task_type] = required_capabilities
        
    async def route_task(self, task_type: str, task_data: Dict) -> Optional[BaseModel]:
        """Route a task to the most appropriate available model.
        
        Args:
            task_type: Type of task to route
            task_data: Task input data and parameters
            
        Returns:
            Selected BaseModel instance or None if no suitable model found
        """
        if task_type not in self.task_types:
            raise ValueError(f"Unknown task type: {task_type}")
            
        required_capabilities = self.task_types[task_type]
        best_model = None
        best_score = 0.0
        
        for model in self.registered_models.values():
            if not model.is_ready:
                continue
                
            # Calculate capability match score
            score = sum(model.capabilities.get(cap, 0.0) 
                    for cap in required_capabilities) / len(required_capabilities)
                    
            if score > best_score:
                best_model = model
                best_score = score
                
        return best_model

