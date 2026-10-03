from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import checkpoints, planner, summary, trips

app = FastAPI(title="Trip Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trips.router)
app.include_router(checkpoints.router)
app.include_router(summary.router)
app.include_router(planner.router)


@app.get("/health")
def health():
    return {"status": "ok"}
