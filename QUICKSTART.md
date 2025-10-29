# TamerX Inventory - Quick Start Guide

Get the complete system running in **5 minutes** with Docker! 🚀

## Prerequisites

- **Node.js 18+** and **pnpm** installed
- **Docker** and **Docker Compose** installed
- That's it! (MySQL runs in Docker)

## One-Command Setup

```bash
# Run the automated setup script
./scripts/setup.sh
```

This script will:
- ✅ Create `.env` file from template
- ✅ Install all dependencies
- ✅ Start MySQL in Docker
- ✅ Run database migrations
- ✅ Set up tables and schema

## Manual Setup (Alternative)

If you prefer manual setup:

### 1. Start MySQL with Docker

```bash
# Start MySQL + phpMyAdmin
docker-compose up -d

# Check if running
docker-compose ps
```

**Access:**
- MySQL: `localhost:3306`
- phpMyAdmin: http://localhost:8080
  - Username: `tamerx_user`
  - Password: `tamerx_secure_password`

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and update:
# DATABASE_URL=mysql://tamerx_user:tamerx_secure_password@localhost:3306/tamerx_inventory
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run Database Migrations

```bash
pnpm run db:push
```

### 5. Start Development Server

```bash
pnpm run dev
```

**Application:** http://localhost:3000

## Create Your First Admin User

1. **Sign in** through the OAuth portal
2. **Find your user ID** in phpMyAdmin or run:

```bash
docker-compose exec mysql mysql -u tamerx_user -ptamerx_secure_password tamerx_inventory -e "SELECT id, email, role FROM users;"
```

3. **Promote to admin:**

```bash
docker-compose exec mysql mysql -u tamerx_user -ptamerx_secure_password tamerx_inventory -e "UPDATE users SET role = 'admin' WHERE email = 'your.email@example.com';"
```

4. **Refresh the page** - You now have full admin access!

## Import Your Products

If you have the `quality_master.csv` file from your Access database:

```bash
# 1. Place CSV in the repo root
cp /path/to/quality_master.csv .

# 2. Update import_data.py (line 237) to:
#    csv_file = '/home/user/tamtam/quality_master.csv'

# 3. Run import
python3 import_data.py
```

The script will import all 1,131+ products with full specifications!

## Docker Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart MySQL
docker-compose restart mysql

# Backup database
docker-compose exec mysql mysqldump -u tamerx_user -ptamerx_secure_password tamerx_inventory > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u tamerx_user -ptamerx_secure_password tamerx_inventory < backup.sql

# Access MySQL CLI
docker-compose exec mysql mysql -u tamerx_user -ptamerx_secure_password tamerx_inventory
```

## Troubleshooting

### Port 3306 Already in Use

If you have MySQL running locally:

```bash
# Option 1: Stop local MySQL
sudo service mysql stop

# Option 2: Change Docker port in docker-compose.yml
# Change "3306:3306" to "3307:3306"
# Update .env: DATABASE_URL=...@localhost:3307/...
```

### Database Connection Errors

```bash
# Check MySQL is running
docker-compose ps

# Check logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

### Migration Issues

```bash
# Reset and retry
docker-compose down
docker volume rm tamtam_mysql_data
docker-compose up -d
pnpm run db:push
```

## Production Deployment

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for:
- Production environment setup
- PM2 process management
- Nginx reverse proxy
- SSL/HTTPS configuration
- Security hardening
- Backup strategies

## Quick Reference

| Service | URL | Credentials |
|---------|-----|-------------|
| Application | http://localhost:3000 | OAuth login |
| phpMyAdmin | http://localhost:8080 | tamerx_user / tamerx_secure_password |
| MySQL | localhost:3306 | tamerx_user / tamerx_secure_password |

## Need Help?

1. Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed documentation
2. Review logs: `docker-compose logs -f`
3. Check application logs in the terminal where `pnpm run dev` is running

---

**Ready to manage your inventory!** 🎉

Start by creating products, managing stock, and exploring all the features in the [Feature Guide](SETUP_GUIDE.md#features-guide).
