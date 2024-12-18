import asyncio
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from src.models.base_model import BaseModel, ModelResponse
from src.orchestration.task_router import TaskRouter

@dataclass
class WorkflowStep:
    """Represents a single step in a workflow."""
    task_type: str
    input_data: Dict[str, Any]
    dependencies: List[str] = None
    output_key: str = None

class OrchestrationEngine:
    """Manages multi-model workflows and task delegation."""
    
    def __init__(self):
        """Initialize the orchestration engine."""
        self.router = TaskRouter()
        self.workflows: Dict[str, List[WorkflowStep]] = {}
        self.results_cache: Dict[str, ModelResponse] = {}
        
    def register_model(self, model: BaseModel) -> None:
        """Register an AI model with the engine.
        
        Args:
            model: BaseModel instance to register
        """
        self.router.register_model(model)
        
    def create_workflow(self, workflow_id: str, steps: List[WorkflowStep]) -> None:
        """Create a new workflow definition.
        
        Args:
            workflow_id: Unique identifier for the workflow
            steps: List of WorkflowStep instances defining the workflow
        """
        self.workflows[workflow_id] = steps
        
    async def execute_workflow(self, workflow_id: str, 
                            initial_data: Dict[str, Any]) -> Dict[str, ModelResponse]:
        """Execute a complete workflow.
        
        Args:
            workflow_id: ID of workflow to execute
            initial_data: Initial input data for the workflow
            
        Returns:
            Dict mapping step output keys to ModelResponses
        """
        if workflow_id not in self.workflows:
            raise ValueError(f"Unknown workflow: {workflow_id}")
            
        self.results_cache.clear()
        steps = self.workflows[workflow_id]
        
        # Execute steps in dependency order
        for step in steps:
            # Wait for dependencies
            if step.dependencies:
                await self._wait_for_dependencies(step.dependencies)
                
            # Prepare input data
            step_input = initial_data.copy()
            if step.dependencies:
                for dep in step.dependencies:
                    step_input.update(self.results_cache[dep].content)
                    
            # Route and execute task
            model = await self.router.route_task(step.task_type, step_input)
            if not model:
                raise RuntimeError(f"No model available for task type: {step.task_type}")
                
            result = await model.process(step_input)
            
            if step.output_key:
                self.results_cache[step.output_key] = result
                
        return self.results_cache
        
    async def _wait_for_dependencies(self, dependencies: List[str]) -> None:
        """Wait for dependent steps to complete.
        
        Args:
            dependencies: List of output keys to wait for
        """
        while not all(dep in self.results_cache for dep in dependencies):
            await asyncio.sleep(0.1)

