from typing import Dict, List, Optional, Type, Any
from src.models.base_model import BaseModel, ModelResponse
from src.config.autogen_config import AgentConfig
import asyncio
from dataclasses import dataclass
from datetime import datetime
class TaskRouter:
    """Routes tasks to appropriate AI models based on capabilities and availability."""

    @dataclass
    class Conversation:
        """Represents an active multi-agent conversation."""
        id: str
        agents: List[BaseModel]
        task_type: str
        created_at: datetime
        last_updated: datetime
        state: Dict[str, Any]
        
    def __init__(self):
        """Initialize the task router."""
        self.registered_models: Dict[str, BaseModel] = {}
        self.task_types: Dict[str, List[str]] = {}
        self.agent_configs: Dict[str, AgentConfig] = {}
        self.active_conversations: Dict[str, Conversation] = {}
        self.autogen_capabilities = {
            "assistant": ["dialogue", "task_solving", "code_generation"],
            "researcher": ["research", "analysis", "information_gathering"],
            "critic": ["review", "feedback", "validation"],
            "executor": ["code_execution", "system_interaction"]
        }
        
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

            def register_agent_config(self, agent_type: str, config: AgentConfig) -> None:
                """Register a new AutoGen agent configuration.
                
                Args:
                    agent_type: Type identifier for the agent
                    config: Agent configuration details
                """
                self.agent_configs[agent_type] = config
                
            def create_conversation(self, task_type: str, agents: List[BaseModel]) -> str:
                """Create a new multi-agent conversation.
                
                Args:
                    task_type: Type of task for the conversation
                    agents: List of agent models to participate
                    
                Returns:
                    Conversation ID string
                """
                conv_id = f"conv_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(self.active_conversations)}"
                conversation = Conversation(
                    id=conv_id,
                    agents=agents,
                    task_type=task_type,
                    created_at=datetime.now(),
                    last_updated=datetime.now(),
                    state={"status": "active", "current_agent": 0}
                )
                self.active_conversations[conv_id] = conversation
                return conv_id
                
            async def handle_conversation_step(self, conv_id: str, message: Dict) -> ModelResponse:
                """Process a single step in a multi-agent conversation.
                
                Args:
                    conv_id: Conversation identifier
                    message: Message data to process
                    
                Returns:
                    Response from the current agent
                """
                if conv_id not in self.active_conversations:
                    raise ValueError(f"Unknown conversation: {conv_id}")
                    
                conv = self.active_conversations[conv_id]
                current_agent = conv.agents[conv.state["current_agent"]]
                
                # Process message with current agent
                response = await current_agent.process(message)
                
                # Update conversation state
                conv.last_updated = datetime.now()
                conv.state["current_agent"] = (conv.state["current_agent"] + 1) % len(conv.agents)
                
                return response
                
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

        # Check if this is an AutoGen task type
        if task_type.startswith("autogen_"):
            agent_type = task_type.split("_")[1]
            if agent_type in self.autogen_capabilities:
                required_capabilities.extend(self.autogen_capabilities[agent_type])

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

