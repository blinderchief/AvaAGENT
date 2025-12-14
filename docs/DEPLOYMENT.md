# 🚀 AvaAgent Production Deployment Guide

> Deploy AvaAgent for real users with enterprise-grade security and scalability.

## 📋 Pre-Deployment Checklist

### 1. Required Services
- [ ] **Domain**: Register `avaagent.app` (or your domain)
- [ ] **SSL Certificate**: Let's Encrypt (free) or commercial certificate
- [ ] **Database**: Neon PostgreSQL (production tier)
- [ ] **Redis**: Redis Cloud or self-hosted
- [ ] **AI API**: Google Gemini API key (production quota)
- [ ] **Authentication**: Clerk production instance
- [ ] **Hosting**: VPS (DigitalOcean, AWS, GCP, etc.)

### 2. Environment Variables

#### Backend (.env.production)
```bash
# Core Settings
APP_ENV=production
APP_DEBUG=false
APP_SECRET_KEY=<generate-with: openssl rand -hex 32>

# ⚠️ CRITICAL: Disable demo mode for production
DEMO_MODE=false

# Database (Neon Production)
DATABASE_URL=postgresql://user:password@prod-host.neon.tech/avaagent?sslmode=require

# AI Service
GOOGLE_API_KEY=<your-production-gemini-key>
GEMINI_MODEL=gemini-1.5-pro

# Authentication (Clerk Production)
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx

# Blockchain (Production RPCs)
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
KITE_RPC_URL=https://rpc.kite.network

# Security
ALLOWED_ORIGINS=https://avaagent.app,https://www.avaagent.app
RATE_LIMIT_PER_MINUTE=100

# Redis
REDIS_URL=redis://:password@redis:6379/0
```

#### Frontend (.env.production)
```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://avaagent.app
NEXT_PUBLIC_API_URL=https://api.avaagent.app

# Clerk (Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Contract Addresses (Already Deployed)
NEXT_PUBLIC_WALLET_FACTORY_ADDRESS=0x849Ca487D5DeD85c93fc3600338a419B100833a8
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0xD26ae761DEBE79Ca423A370C0085D75b26Ecaf28
NEXT_PUBLIC_PAYMENT_FACILITATOR_ADDRESS=0xD5932aF5c315C0A1fD9D486E0f58b7C210866ADF
NEXT_PUBLIC_INTENT_PROCESSOR_ADDRESS=0x4B6171fA771fdA1F86445a5C06b0d5dA11875BC4
```

---

## 🖥️ Deployment Options

### Option A: Docker Compose (Recommended for VPS)

#### Step 1: Prepare Server
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose git -y
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### Step 2: Clone & Configure
```bash
git clone https://github.com/your-org/avaagent.git
cd avaagent

# Copy and edit production configs
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env

# Edit with your production values
nano backend/.env
nano frontend/.env
```

#### Step 3: SSL Certificates (Let's Encrypt)
```bash
# Create SSL directory
mkdir -p nginx/ssl

# Get certificates (replace with your domain)
sudo certbot certonly --standalone \
  -d avaagent.app \
  -d www.avaagent.app \
  -d api.avaagent.app

# Copy certificates
sudo cp -r /etc/letsencrypt/live nginx/ssl/
sudo chmod -R 755 nginx/ssl
```

#### Step 4: Deploy
```bash
# Build and start services
docker-compose -f docker-compose.production.yml up -d --build

# Check status
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs -f
```

#### Step 5: Database Migration
```bash
# Run migrations
docker-compose -f docker-compose.production.yml exec backend \
  alembic upgrade head
```

---

### Option B: Cloud Platform Deployment

#### AWS (ECS + RDS)
1. Create ECR repositories for frontend/backend
2. Push Docker images
3. Create ECS cluster with Fargate
4. Use RDS PostgreSQL for database
5. Use ElastiCache for Redis
6. Use ALB for load balancing with ACM certificates

#### Google Cloud (Cloud Run)
```bash
# Build and push images
gcloud builds submit --tag gcr.io/PROJECT/avaagent-backend ./backend
gcloud builds submit --tag gcr.io/PROJECT/avaagent-frontend ./frontend

# Deploy
gcloud run deploy avaagent-backend --image gcr.io/PROJECT/avaagent-backend
gcloud run deploy avaagent-frontend --image gcr.io/PROJECT/avaagent-frontend
```

#### Vercel + Railway (Easiest)
```bash
# Frontend: Deploy to Vercel
cd frontend
vercel --prod

# Backend: Deploy to Railway
cd backend
railway up
```

---

## 🔒 Security Hardening

### 1. Disable Demo Mode
**CRITICAL**: Ensure `DEMO_MODE=false` in production!

```python
# backend/app/core/security.py
# This bypasses authentication when True - NEVER enable in production
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
```

### 2. Rotate Secrets
```bash
# Generate new secrets
openssl rand -hex 32  # APP_SECRET_KEY
openssl rand -hex 16  # REDIS_PASSWORD
```

### 3. Configure CORS Properly
```python
# Only allow your production domains
ALLOWED_ORIGINS=https://avaagent.app,https://www.avaagent.app
```

### 4. Enable Rate Limiting
The nginx configuration includes rate limiting:
- API: 30 requests/second per IP
- Frontend: 50 requests/second per IP

### 5. Database Security
- Use SSL connections (`sslmode=require`)
- Create read-only replicas for analytics
- Enable point-in-time recovery
- Regular backups

---

## 📊 Monitoring & Logging

### Health Checks
```bash
# Backend health
curl https://api.avaagent.app/api/v1/health

# Frontend health
curl https://avaagent.app/health
```

### Log Access
```bash
# Docker logs
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend

# Nginx logs
docker-compose -f docker-compose.production.yml logs -f nginx
```

### Recommended Monitoring Tools
- **Uptime**: UptimeRobot, Pingdom
- **APM**: Sentry, DataDog, New Relic
- **Logs**: Logtail, Papertrail, CloudWatch
- **Metrics**: Prometheus + Grafana

---

## 🔄 CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build and push Docker images
        run: |
          docker build -t avaagent-backend ./backend
          docker build -t avaagent-frontend ./frontend
          
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/avaagent
            git pull origin main
            docker-compose -f docker-compose.production.yml up -d --build
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. 502 Bad Gateway
```bash
# Check if services are running
docker-compose -f docker-compose.production.yml ps

# Check backend logs
docker-compose -f docker-compose.production.yml logs backend
```

#### 2. SSL Certificate Errors
```bash
# Renew certificates
sudo certbot renew

# Copy new certificates
sudo cp -r /etc/letsencrypt/live nginx/ssl/

# Restart nginx
docker-compose -f docker-compose.production.yml restart nginx
```

#### 3. Database Connection Failed
```bash
# Test database connection
docker-compose -f docker-compose.production.yml exec backend \
  python -c "from app.core.database import engine; print(engine.url)"
```

#### 4. Authentication Not Working
- Verify Clerk production keys
- Check `DEMO_MODE=false`
- Verify allowed redirect URLs in Clerk dashboard

---

## 📈 Scaling

### Horizontal Scaling
```yaml
# docker-compose.production.yml
services:
  backend:
    deploy:
      replicas: 3
```

### Vertical Scaling
Upgrade container resources in docker-compose:
```yaml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 4G
```

---

## ✅ Post-Deployment Verification

1. [ ] Visit https://avaagent.app - Landing page loads
2. [ ] Sign up/Sign in works (Clerk integration)
3. [ ] Dashboard loads after authentication
4. [ ] Chat with AI agents works
5. [ ] Commerce features work
6. [ ] Wallet creation works
7. [ ] Check https://api.avaagent.app/api/v1/health returns OK
8. [ ] SSL certificate is valid (green padlock)
9. [ ] Mobile responsive design works
10. [ ] No console errors in production

---

## 📞 Support

For deployment assistance:
- GitHub Issues: [github.com/your-org/avaagent/issues](https://github.com/your-org/avaagent/issues)
- Documentation: [docs.avaagent.app](https://docs.avaagent.app)

---

**⚠️ Security Reminder**: Never commit `.env` files or expose production secrets. Use environment variables or secret management services.
