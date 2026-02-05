"""
API version 1 router
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, clusters, nodes, jobs, templates, users, audit

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(clusters.router, prefix="/clusters", tags=["Clusters"])
api_router.include_router(nodes.router, prefix="/clusters/{cluster_id}/nodes", tags=["Nodes"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(templates.router, prefix="/templates", tags=["Templates"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(audit.router, prefix="/audit-logs", tags=["Audit Logs"])
