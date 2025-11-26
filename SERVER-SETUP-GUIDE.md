# 🚀 Server Setup Guide - Hippocrates Dental

> **Մանրամասն քայլ առ քայլ հրահանգ server-ի վրա տեղադրման համար**

---

## ✅ Նախապայմաններ

Նախքան սկսելը, համոզվեք, որ server-ի վրա տեղադրված են:

- ✅ **Node.js 20+** (`node --version`)
- ✅ **npm** (`npm --version`)
- ✅ **Git** (`git --version`)
- ✅ **PM2** (optional, բայց խորհուրդ է տրվում)

---

## 📥 Քայլ 1: Clone Repository

```bash
# SSH-ով server-ին միացեք
ssh user@your-server-ip

# Clone repository
git clone https://github.com/ginosyan00/hipo.git
cd hipo
```

---

## 🔧 Քայլ 2: Backend Setup

### 2.1. Install Dependencies

```bash
cd backend
npm install
```

### 2.2. Environment Variables

Ստեղծեք `.env` ֆայլ:

```bash
nano .env
```

Կամ օգտագործեք `cat`:

```bash
cat > .env << 'EOF'
# Server
NODE_ENV=production
PORT=5000

# Database (SQLite - path-ը պետք է լինի absolute կամ relative backend folder-ից)
DATABASE_URL=file:./prisma/dev.db

# JWT (ՊԵՏՔ Է ԼԻՆԵԼ ԱՌԱՆՋԱՎՆ 32 ՆԻՇ!)
JWT_SECRET=your-super-secret-key-at-least-32-characters-long-change-this
JWT_EXPIRES_IN=7d

# CORS (Փոխեք ձեր frontend URL-ով)
CORS_ORIGIN=http://your-server-ip:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
EOF
```

**⚠️ ԿԱՐԵՎՈՐ:**
- `JWT_SECRET` - պետք է լինի առնվազն 32 նիշ (գեներացրեք strong key)
- `DATABASE_URL` - path-ը պետք է լինի `file:./prisma/dev.db` (relative path backend folder-ից)
- `CORS_ORIGIN` - փոխեք ձեր frontend URL-ով

### 2.3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 2.4. Verify Database File

Ստուգեք, որ database file-ը կա:

```bash
ls -lh prisma/dev.db
# Պետք է ցույց տա file-ը
```

Եթե file-ը չկա, ստուգեք, որ push է արվել:

```bash
git ls-files | grep dev.db
# Պետք է ցույց տա: backend/prisma/dev.db
```

### 2.5. Test Database Connection

```bash
# Test Prisma connection
node -e "import('@prisma/client').then(({PrismaClient}) => { const p = new PrismaClient(); p.\$connect().then(() => { console.log('✅ Database connected!'); p.\$disconnect(); }); })"
```

---

## 🎨 Քայլ 3: Frontend Setup

### 3.1. Install Dependencies

```bash
cd ../frontend
npm install
```

### 3.2. Environment Variables

Ստեղծեք `.env` ֆայլ:

```bash
cat > .env << 'EOF'
# Backend API URL (փոխեք ձեր server IP-ով)
VITE_API_URL=http://your-server-ip:5000
EOF
```

**⚠️ ԿԱՐԵՎՈՐ:**
- `VITE_API_URL` - պետք է լինի backend-ի URL (օրինակ: `http://192.168.1.100:5000`)

### 3.3. Build Production

```bash
npm run build
```

Build-ը կստեղծի `dist/` folder-ը:

```bash
ls -lh dist/
# Պետք է ցույց տա build-ված files-ները
```

---

## 🚀 Քայլ 4: Start Services

### Option A: PM2 (Recommended)

#### 4.1. Install PM2

```bash
npm install -g pm2
```

#### 4.2. Start Backend

```bash
cd ../backend
pm2 start src/server.js --name hippocrates-backend --env production
pm2 save
```

#### 4.3. Start Frontend (Static Server)

```bash
cd ../frontend
npm install -g serve
pm2 serve dist 3000 --name hippocrates-frontend --spa
pm2 save
```

#### 4.4. PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs hippocrates-backend
pm2 logs hippocrates-frontend

# Restart
pm2 restart hippocrates-backend

# Stop
pm2 stop hippocrates-backend

# Auto-start on reboot
pm2 startup
pm2 save
```

### Option B: Manual (Development/Testing)

#### Backend

```bash
cd backend
npm start
# կամ
node src/server.js
```

#### Frontend

```bash
cd frontend
npm run preview
# կամ
serve -s dist -l 3000
```

---

## 🔍 Քայլ 5: Verify Everything Works

### 5.1. Backend Health Check

```bash
curl http://localhost:5000/health
# Պետք է վերադարձնի: {"status":"ok"}
```

### 5.2. Database Test

```bash
# Test database query
curl http://localhost:5000/api/public/clinics
# Պետք է վերադարձնի clinics list (կամ empty array)
```

### 5.3. Frontend

Բացեք browser-ում:

```
http://your-server-ip:3000
```

---

## 🔒 Քայլ 6: Firewall Configuration

Եթե օգտագործում եք firewall (ufw, iptables), բացեք port-ները:

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 5000/tcp  # Backend
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 22/tcp    # SSH
sudo ufw reload

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

---

## 🐛 Troubleshooting

### Database չի աշխատում

**Սխալ:** `Error: P1001: Can't reach database server`

**Լուծում:**
```bash
# 1. Ստուգեք DATABASE_URL-ը
cat backend/.env | grep DATABASE_URL

# 2. Ստուգեք file path-ը
cd backend
ls -lh prisma/dev.db

# 3. Ստուգեք file permissions
chmod 644 prisma/dev.db
chmod 755 prisma/

# 4. Ստուգեք absolute path
pwd
# Օրինակ: /home/user/hipo/backend
# DATABASE_URL պետք է լինի: file:./prisma/dev.db
```

### Backend չի start լինում

**Սխալ:** `JWT_SECRET is required`

**Լուծում:**
```bash
# Ստուգեք .env file-ը
cat backend/.env

# JWT_SECRET պետք է լինի առնվազն 32 նիշ
# Գեներացրեք նոր key:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend չի աշխատում

**Սխալ:** CORS error

**Լուծում:**
```bash
# 1. Ստուգեք CORS_ORIGIN-ը backend-ում
cat backend/.env | grep CORS_ORIGIN

# 2. Ստուգեք VITE_API_URL-ը frontend-ում
cat frontend/.env | grep VITE_API_URL

# 3. Restart backend
pm2 restart hippocrates-backend
```

### Port-ը արդեն օգտագործվում է

**Սխալ:** `EADDRINUSE: address already in use`

**Լուծում:**
```bash
# Գտեք process-ը, որը օգտագործում է port-ը
sudo lsof -i :5000
# կամ
sudo netstat -tulpn | grep 5000

# Kill process
sudo kill -9 <PID>

# Կամ փոխեք PORT-ը .env-ում
```

---

## 📊 Monitoring

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# View all logs
pm2 logs

# View specific service
pm2 logs hippocrates-backend --lines 100
```

### System Logs

```bash
# Ubuntu/Debian
sudo journalctl -u pm2 -f

# View PM2 logs
cat ~/.pm2/logs/hippocrates-backend-out.log
cat ~/.pm2/logs/hippocrates-backend-error.log
```

---

## 🔄 Update Project

Երբ նոր changes push են արվում:

```bash
cd /path/to/hipo

# Pull latest changes
git pull origin main

# Backend
cd backend
npm install
npm run prisma:generate
pm2 restart hippocrates-backend

# Frontend
cd ../frontend
npm install
npm run build
pm2 restart hippocrates-frontend
```

---

## ✅ Checklist

Մինչ server-ի վրա տեղադրելը, համոզվեք:

- [ ] Node.js 20+ տեղադրված է
- [ ] Git repository clone է արվել
- [ ] Backend dependencies install են արվել
- [ ] Frontend dependencies install են արվել
- [ ] `.env` files ստեղծված են (backend և frontend)
- [ ] `JWT_SECRET` առնվազն 32 նիշ է
- [ ] `DATABASE_URL` ճիշտ է (file:./prisma/dev.db)
- [ ] Database file-ը կա (prisma/dev.db)
- [ ] Prisma Client generate է արվել
- [ ] Frontend build է արվել
- [ ] PM2 services start են արվել
- [ ] Firewall port-ները բաց են
- [ ] Health check աշխատում է
- [ ] Frontend բացվում է browser-ում

---

## 🎉 Պատրաստ է!

Եթե բոլոր քայլերը ավարտված են, պրոյեկտը պետք է աշխատի:

- **Backend:** `http://your-server-ip:5000`
- **Frontend:** `http://your-server-ip:3000`
- **Health Check:** `http://your-server-ip:5000/health`

**Database-ը աշխատում է**, քանի որ `dev.db` file-ը push է արվել repository-ում և կլինի server-ի վրա clone-ից հետո:

---

**Վերջին թարմացում:** 2025-01-19

