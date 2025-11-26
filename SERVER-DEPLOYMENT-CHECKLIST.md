# ✅ Server Deployment Checklist - Hippocrates Dental

## 📋 Պրոյեկտի պատրաստվածության ստուգում

### ✅ Push արված ֆայլեր

#### 1. **Backend**
- ✅ `backend/package.json` - Dependencies
- ✅ `backend/src/` - Ամբողջ source code
- ✅ `backend/prisma/schema.prisma` - Database schema
- ✅ `backend/prisma/migrations/` - Բոլոր migrations
- ✅ `backend/prisma/dev.db` - **Database file (SQLite)**
- ✅ `backend/uploads/` - Uploaded files

#### 2. **Frontend**
- ✅ `frontend/package.json` - Dependencies
- ✅ `frontend/src/` - Ամբողջ source code
- ✅ `frontend/vite.config.ts` - Vite configuration
- ✅ `frontend/tailwind.config.js` - Tailwind configuration

#### 3. **Documentation**
- ✅ `README.md` - Main README
- ✅ `backend/README.md` - Backend README
- ✅ `frontend/README.md` - Frontend README
- ✅ `mdfiles/DEPLOYMENT.md` - Deployment guide
- ✅ `mdfiles/env.example.txt` - Environment variables example

#### 4. **Configuration**
- ✅ `.gitignore` - Git ignore rules
- ✅ `package.json` files (root, backend, frontend)

---

## 🚀 Server-ի վրա տեղադրման քայլեր

### 1. **Clone Repository**
```bash
git clone https://github.com/ginosyan00/hipo.git
cd hipo
```

### 2. **Backend Setup**

```bash
cd backend

# Install dependencies
npm install

# Database-ը արդեն կա (dev.db push է արվել)
# Prisma Client generate
npm run prisma:generate

# Environment variables
# Ստեղծել .env ֆայլ (տես mdfiles/env.example.txt)
cp ../mdfiles/env.example.txt .env
# Կամ ստեղծել manually:
# DATABASE_URL=file:./prisma/dev.db
# JWT_SECRET=your-secret-key-min-32-chars
# PORT=5000
# NODE_ENV=production
# CORS_ORIGIN=https://your-frontend-domain.com

# Start server
npm start
```

### 3. **Frontend Setup**

```bash
cd frontend

# Install dependencies
npm install

# Environment variables
# Ստեղծել .env ֆայլ
echo "VITE_API_URL=http://your-backend-url:5000" > .env

# Build production
npm run build

# Preview (optional)
npm run preview
```

### 4. **Production Deployment**

#### Option A: PM2 (Node.js Process Manager)
```bash
# Install PM2 globally
npm install -g pm2

# Backend
cd backend
pm2 start src/server.js --name hippocrates-backend
pm2 save
pm2 startup

# Frontend (serve static files)
cd frontend
npm install -g serve
serve -s dist -l 3000
# Կամ PM2-ով:
pm2 serve dist 3000 --name hippocrates-frontend --spa
```

#### Option B: Nginx + Systemd
```bash
# Backend service
sudo nano /etc/systemd/system/hippocrates-backend.service
```

```ini
[Unit]
Description=Hippocrates Backend API
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/hipo/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
Environment=NODE_ENV=production
EnvironmentFile=/path/to/hipo/backend/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable hippocrates-backend
sudo systemctl start hippocrates-backend
```

#### Option C: Docker (Recommended)
```bash
# Ստեղծել Dockerfile-ներ (տես ներքև)
docker-compose up -d
```

---

## 🐳 Docker Deployment (Recommended)

### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["node", "src/server.js"]
```

### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./prisma/dev.db
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN}
    volumes:
      - ./backend/prisma:/app/prisma
      - ./backend/uploads:/app/uploads
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

---

## ⚠️ Կարևոր նշումներ

### 1. **Database**
- ✅ Database-ը (`dev.db`) արդեն push է արվել
- ⚠️ SQLite-ը հարմար է development-ի համար
- 💡 Production-ի համար խորհուրդ է տրվում օգտագործել PostgreSQL կամ MySQL

### 2. **Environment Variables**
- ⚠️ **JWT_SECRET** - պետք է լինի առնվազն 32 նիշ
- ⚠️ **CORS_ORIGIN** - պետք է համապատասխանի frontend URL-ին
- ⚠️ **DATABASE_URL** - SQLite-ի համար: `file:./prisma/dev.db`

### 3. **File Permissions**
```bash
# Uploads folder
chmod -R 755 backend/uploads

# Database
chmod 644 backend/prisma/dev.db
```

### 4. **Security**
- ✅ HTTPS-ը պարտադիր է production-ում
- ✅ Firewall-ը պետք է բաց լինի միայն 80, 443, 5000 port-ների համար
- ✅ JWT_SECRET-ը պետք է լինի strong և unique

---

## 🔍 Ստուգում

### Backend Health Check
```bash
curl http://localhost:5000/health
# Պետք է վերադարձնի: {"status":"ok"}
```

### Frontend
```bash
# Բացել browser-ում
http://your-server-ip
```

---

## 📞 Troubleshooting

### Backend չի աշխատում
1. Ստուգել `.env` ֆայլը
2. Ստուգել `JWT_SECRET` (պետք է լինի 32+ նիշ)
3. Ստուգել database path-ը
4. Ստուգել logs: `pm2 logs hippocrates-backend`

### Frontend չի աշխատում
1. Ստուգել `VITE_API_URL` environment variable-ը
2. Ստուգել build-ը: `npm run build`
3. Ստուգել CORS settings backend-ում

### Database errors
1. Ստուգել `dev.db` file permissions
2. Ստուգել Prisma Client: `npm run prisma:generate`
3. Ստուգել migrations: `npm run prisma:migrate`

---

## ✅ Պատրաստ է!

Պրոյեկտը պատրաստ է server-ի վրա տեղադրման համար:

**Repository:** https://github.com/ginosyan00/hipo.git

**Push արված:**
- ✅ Source code
- ✅ Database (dev.db)
- ✅ Uploads
- ✅ Migrations
- ✅ Documentation

**Պետք է server-ի վրա:**
- Node.js 20+
- npm
- (Optional) PM2, Docker, Nginx

---

**Վերջին թարմացում:** 2025-01-19

