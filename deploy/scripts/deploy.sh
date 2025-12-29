#!/bin/bash
set -e

# VoIP SaaS Platform Deployment Script
# Usage: ./deploy.sh [environment] [action]
# Environments: staging, production
# Actions: deploy, rollback, status

ENVIRONMENT=${1:-staging}
ACTION=${2:-deploy}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check required tools
check_requirements() {
    log_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is required but not installed."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is required but not installed."
        exit 1
    fi
    
    log_info "All requirements met."
}

# Load environment variables
load_env() {
    local env_file="${PROJECT_ROOT}/.env.${ENVIRONMENT}"
    
    if [ -f "$env_file" ]; then
        log_info "Loading environment from $env_file"
        export $(grep -v '^#' "$env_file" | xargs)
    else
        log_warn "Environment file $env_file not found. Using defaults."
        
        if [ ! -f "${PROJECT_ROOT}/.env" ]; then
            log_error "No .env file found. Please create one from .env.example"
            exit 1
        fi
        export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs)
    fi
}

# Build and push Docker images
build_images() {
    log_info "Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Build backend
    docker build -t voip-saas-backend:latest -f packages/backend/Dockerfile packages/backend
    
    # Build frontend
    docker build -t voip-saas-frontend:latest -f packages/frontend/Dockerfile packages/frontend
    
    log_info "Docker images built successfully."
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    docker-compose -f docker-compose.prod.yml exec -T backend npm run db:migrate
    
    log_info "Migrations completed."
}

# Deploy to environment
deploy() {
    log_info "Deploying to ${ENVIRONMENT}..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest images (if using registry)
    if [ -n "$REGISTRY" ]; then
        docker-compose -f docker-compose.prod.yml pull
    fi
    
    # Start/update services
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    # Run migrations
    run_migrations
    
    log_info "Deployment to ${ENVIRONMENT} completed successfully!"
}

# Rollback to previous version
rollback() {
    log_info "Rolling back ${ENVIRONMENT}..."
    
    cd "$PROJECT_ROOT"
    
    # Stop current containers
    docker-compose -f docker-compose.prod.yml down
    
    # Start previous version
    docker-compose -f docker-compose.prod.yml up -d
    
    log_info "Rollback completed."
}

# Show status
status() {
    log_info "Checking status of ${ENVIRONMENT}..."
    
    cd "$PROJECT_ROOT"
    
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    log_info "Container logs (last 20 lines):"
    docker-compose -f docker-compose.prod.yml logs --tail=20
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    local backend_url="${BACKEND_URL:-http://localhost:5000}"
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "${backend_url}/health" | grep -q "ok"; then
            log_info "Health check passed!"
            return 0
        fi
        
        log_warn "Attempt $attempt/$max_attempts - Waiting for backend..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Main execution
main() {
    echo "=========================================="
    echo "VoIP SaaS Platform - Deployment Script"
    echo "Environment: ${ENVIRONMENT}"
    echo "Action: ${ACTION}"
    echo "=========================================="
    
    check_requirements
    load_env
    
    case $ACTION in
        deploy)
            build_images
            deploy
            health_check
            ;;
        rollback)
            rollback
            ;;
        status)
            status
            ;;
        build)
            build_images
            ;;
        migrate)
            run_migrations
            ;;
        *)
            log_error "Unknown action: $ACTION"
            echo "Usage: $0 [environment] [action]"
            echo "  Environments: staging, production"
            echo "  Actions: deploy, rollback, status, build, migrate"
            exit 1
            ;;
    esac
}

main "$@"
