from fastapi import FastAPI, HTTPException
from typing import Dict, List, Optional
from pydantic import BaseModel
from src.orchestration.engine import OrchestrationEngine
from src.models.base_model import ModelResponse

app = FastAPI(title="Multi-Model AI Platform API")
engine = OrchestrationEngine()

class ChatRequest(BaseModel):
    message: str
    model_id: Optional[str] = None
    task_type: str = "chat"
    parameters: Dict = {}

class WorkflowRequest(BaseModel):
    workflow_id: str
    steps: List[Dict]
    initial_data: Dict

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        if request.model_id:
            model = engine.router.registered_models.get(request.model_id)
            if not model:
                raise HTTPException(status_code=404, detail="Model not found")
            response = await model.process({
                "message": request.message,
                **request.parameters
            })
        else:
            model = await engine.router.route_task(
                request.task_type,
                {"message": request.message, **request.parameters}
            )
            if not model:
                raise HTTPException(
                    status_code=404,
                    detail="No suitable model found for task"
                )
            response = await model.process({
                "message": request.message,
                **request.parameters
            })
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/workflow")
async def execute_workflow(request: WorkflowRequest):
    try:
        return await engine.execute_workflow(
            request.workflow_id,
            request.initial_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models")
async def list_models():
    return {
        model_id: {
            "capabilities": model.capabilities,
            "is_ready": model.is_ready
        }
        for model_id, model in engine.router.registered_models.items()
    }
