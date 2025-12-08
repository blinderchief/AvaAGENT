#!/bin/bash
# AvaAgent Production Deployment Script
# Deploys the full stack to production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${ENVIRONMENT:-production}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-""}
IMAGE_TAG=${IMAGE_TAG:-latest}

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         AvaAgent Production Deployment Script                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        exit 1
    fi
    
    # Check .env file
    if [ ! -f .env ]; then
        echo -e "${RED}❌ .env file not found. Copy .env.example and configure it.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Load environment variables
load_env() {
    echo -e "${YELLOW}📝 Loading environment variables...${NC}"
    
    if [ -f .env ]; then
        export $(grep -v '^#' .env | xargs)
    fi
    
    # Validate required variables
    required_vars=(
        "DATABASE_URL"
        "CLERK_SECRET_KEY"
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
        "GEMINI_API_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}❌ Required variable $var is not set${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ Environment variables loaded${NC}"
}

# Build Docker images
build_images() {
    echo -e "${YELLOW}🔨 Building Docker images...${NC}"
    
    # Build backend
    echo -e "${BLUE}Building backend...${NC}"
    docker build -t avaagent-backend:${IMAGE_TAG} ./backend
    
    # Build frontend
    echo -e "${BLUE}Building frontend...${NC}"
    docker build -t avaagent-frontend:${IMAGE_TAG} ./frontend
    
    echo -e "${GREEN}✅ Images built successfully${NC}"
}

# Push to registry (if configured)
push_images() {
    if [ -n "$DOCKER_REGISTRY" ]; then
        echo -e "${YELLOW}📤 Pushing images to registry...${NC}"
        
        docker tag avaagent-backend:${IMAGE_TAG} ${DOCKER_REGISTRY}/avaagent-backend:${IMAGE_TAG}
        docker tag avaagent-frontend:${IMAGE_TAG} ${DOCKER_REGISTRY}/avaagent-frontend:${IMAGE_TAG}
        
        docker push ${DOCKER_REGISTRY}/avaagent-backend:${IMAGE_TAG}
        docker push ${DOCKER_REGISTRY}/avaagent-frontend:${IMAGE_TAG}
        
        echo -e "${GREEN}✅ Images pushed to registry${NC}"
    else
        echo -e "${YELLOW}⏭️  Skipping push (no registry configured)${NC}"
    fi
}

# Run database migrations
run_migrations() {
    echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
    
    docker-compose run --rm backend python -c "
from app.core.database import engine
from app.models import Base
import asyncio

async def run():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

asyncio.run(run())
print('Migrations completed successfully')
"
    
    echo -e "${GREEN}✅ Migrations completed${NC}"
}

# Deploy services
deploy_services() {
    echo -e "${YELLOW}🚀 Deploying services...${NC}"
    
    # Pull latest images (if using registry)
    if [ -n "$DOCKER_REGISTRY" ]; then
        docker-compose pull
    fi
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be healthy
    echo -e "${BLUE}Waiting for services to be healthy...${NC}"
    sleep 10
    
    # Check service health
    check_health
    
    echo -e "${GREEN}✅ Services deployed successfully${NC}"
}

# Health check
check_health() {
    echo -e "${YELLOW}🏥 Checking service health...${NC}"
    
    # Check backend
    BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health || echo "000")
    if [ "$BACKEND_HEALTH" == "200" ]; then
        echo -e "${GREEN}✅ Backend: Healthy${NC}"
    else
        echo -e "${RED}❌ Backend: Unhealthy (HTTP $BACKEND_HEALTH)${NC}"
    fi
    
    # Check frontend
    FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
    if [ "$FRONTEND_HEALTH" == "200" ]; then
        echo -e "${GREEN}✅ Frontend: Healthy${NC}"
    else
        echo -e "${RED}❌ Frontend: Unhealthy (HTTP $FRONTEND_HEALTH)${NC}"
    fi
}

# Show logs
show_logs() {
    echo -e "${YELLOW}📜 Showing recent logs...${NC}"
    docker-compose logs --tail=50
}

# Cleanup old images
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    docker system prune -f
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main deployment flow
main() {
    case ${1:-deploy} in
        deploy)
            check_prerequisites
            load_env
            build_images
            push_images
            run_migrations
            deploy_services
            ;;
        build)
            build_images
            ;;
        push)
            push_images
            ;;
        migrate)
            load_env
            run_migrations
            ;;
        up)
            deploy_services
            ;;
        down)
            docker-compose down
            ;;
        restart)
            docker-compose restart
            ;;
        logs)
            show_logs
            ;;
        health)
            check_health
            ;;
        cleanup)
            cleanup
            ;;
        *)
            echo "Usage: $0 {deploy|build|push|migrate|up|down|restart|logs|health|cleanup}"
            exit 1
            ;;
    esac
}

main "$@"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║               Deployment Complete! 🎉                         ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║  Frontend: http://localhost:3000                             ║${NC}"
echo -e "${BLUE}║  Backend:  http://localhost:8000                             ║${NC}"
echo -e "${BLUE}║  API Docs: http://localhost:8000/docs                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
