#!/bin/bash
# =============================================================================
# AvaAgent Production Deployment Script
# =============================================================================
# Usage: ./scripts/deploy-production.sh [options]
#
# Options:
#   --build     Rebuild Docker images
#   --migrate   Run database migrations
#   --ssl       Setup SSL certificates
#   --help      Show this help
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
PROJECT_NAME="avaagent"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    echo "AvaAgent Production Deployment Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --build     Rebuild Docker images before deploying"
    echo "  --migrate   Run database migrations after deployment"
    echo "  --ssl       Setup SSL certificates with Let's Encrypt"
    echo "  --logs      Follow logs after deployment"
    echo "  --stop      Stop all services"
    echo "  --restart   Restart all services"
    echo "  --status    Show service status"
    echo "  --help      Show this help"
    exit 0
}

check_requirements() {
    log_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    log_info "Requirements check passed"
}

check_env_files() {
    log_info "Checking environment files..."
    
    if [ ! -f "backend/.env" ]; then
        log_error "Backend .env file not found!"
        log_warn "Copy backend/.env.production to backend/.env and configure it"
        exit 1
    fi
    
    if [ ! -f "frontend/.env" ]; then
        log_error "Frontend .env file not found!"
        log_warn "Copy frontend/.env.production to frontend/.env and configure it"
        exit 1
    fi
    
    # Check for placeholder values
    if grep -q "CHANGE_ME" backend/.env; then
        log_error "Backend .env contains CHANGE_ME placeholders!"
        log_warn "Please configure all production values before deploying"
        exit 1
    fi
    
    # Verify DEMO_MODE is disabled
    if grep -q "DEMO_MODE=true" backend/.env; then
        log_error "DEMO_MODE is enabled in backend/.env!"
        log_warn "Set DEMO_MODE=false for production deployment"
        exit 1
    fi
    
    log_info "Environment files validated"
}

setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    if [ ! -d "nginx/ssl" ]; then
        mkdir -p nginx/ssl
    fi
    
    read -p "Enter your domain (e.g., avaagent.app): " DOMAIN
    read -p "Enter your email for Let's Encrypt: " EMAIL
    
    # Stop nginx if running
    docker-compose -f $COMPOSE_FILE stop nginx 2>/dev/null || true
    
    # Get certificates
    docker run -it --rm \
        -v "$(pwd)/nginx/ssl:/etc/letsencrypt" \
        -p 80:80 \
        certbot/certbot certonly \
        --standalone \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        -d "api.$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email
    
    log_info "SSL certificates obtained successfully"
}

build_images() {
    log_info "Building Docker images..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    log_info "Images built successfully"
}

deploy() {
    log_info "Deploying AvaAgent to production..."
    
    if [ "$BUILD" = true ]; then
        build_images
    fi
    
    docker-compose -f $COMPOSE_FILE up -d
    
    log_info "Waiting for services to start..."
    sleep 10
    
    # Health check
    if curl -sf http://localhost/health > /dev/null; then
        log_info "Frontend is healthy"
    else
        log_warn "Frontend health check failed"
    fi
    
    if curl -sf http://localhost:8000/api/v1/health > /dev/null; then
        log_info "Backend is healthy"
    else
        log_warn "Backend health check failed"
    fi
    
    log_info "Deployment complete!"
}

run_migrations() {
    log_info "Running database migrations..."
    docker-compose -f $COMPOSE_FILE exec -T backend alembic upgrade head
    log_info "Migrations complete"
}

show_status() {
    log_info "Service Status:"
    docker-compose -f $COMPOSE_FILE ps
}

show_logs() {
    log_info "Following logs (Ctrl+C to exit)..."
    docker-compose -f $COMPOSE_FILE logs -f
}

stop_services() {
    log_info "Stopping services..."
    docker-compose -f $COMPOSE_FILE down
    log_info "Services stopped"
}

restart_services() {
    log_info "Restarting services..."
    docker-compose -f $COMPOSE_FILE restart
    log_info "Services restarted"
}

# Parse arguments
BUILD=false
MIGRATE=false
SSL=false
LOGS=false
STOP=false
RESTART=false
STATUS=false

for arg in "$@"; do
    case $arg in
        --build)
            BUILD=true
            ;;
        --migrate)
            MIGRATE=true
            ;;
        --ssl)
            SSL=true
            ;;
        --logs)
            LOGS=true
            ;;
        --stop)
            STOP=true
            ;;
        --restart)
            RESTART=true
            ;;
        --status)
            STATUS=true
            ;;
        --help)
            show_help
            ;;
    esac
done

# Main execution
echo "=============================================="
echo "  AvaAgent Production Deployment"
echo "=============================================="
echo ""

check_requirements

if [ "$STOP" = true ]; then
    stop_services
    exit 0
fi

if [ "$RESTART" = true ]; then
    restart_services
    exit 0
fi

if [ "$STATUS" = true ]; then
    show_status
    exit 0
fi

if [ "$SSL" = true ]; then
    setup_ssl
fi

check_env_files
deploy

if [ "$MIGRATE" = true ]; then
    run_migrations
fi

show_status

if [ "$LOGS" = true ]; then
    show_logs
fi

echo ""
log_info "🚀 AvaAgent is now running in production!"
echo ""
echo "  Frontend: https://avaagent.app"
echo "  API:      https://api.avaagent.app"
echo ""
