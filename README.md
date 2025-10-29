# TamerX Inventory Management System

**Complete, production-ready inventory management system for steering rack components**

[![Status](https://img.shields.io/badge/status-production--ready-success)](/)
[![Features](https://img.shields.io/badge/features-100%25%20complete-brightgreen)](/)
[![License](https://img.shields.io/badge/license-MIT-blue)](/)

---

## 🚀 Quick Start

**Choose your setup based on your devices:**

### For Windows/HP Machines (Local Setup)

```bash
# Automated setup with Docker
./scripts/setup.sh

# Start development server
pnpm run dev
```

**See:** [QUICKSTART.md](QUICKSTART.md)

### For Chromebooks or Cloud Access

**Deploy to cloud (works on ALL devices!):**

1. Create free PlanetScale database
2. Deploy to Vercel
3. Access from anywhere!

**See:** [CLOUD_DEPLOY.md](CLOUD_DEPLOY.md)

---

## 📋 What's Included

### ✅ Complete Feature Set

- **Product Management** - Full CRUD with 40+ fields
- **Image Support** - Primary + gallery images
- **Search** - Quick search + AI semantic search
- **Stock Management** - Set/adjust with alerts
- **Purchase Orders** - Full PO workflow
- **User Management** - 5-tier role system
- **Analytics Dashboard** - Charts & insights
- **Data Export** - CSV/JSON export
- **Custom Forms** - Dynamic form builder
- **Barcode Scanner** - Mobile PWA ready
- **Role Permissions** - Granular access control

### 📊 By The Numbers

- **20** major features implemented
- **11** pages/routes
- **40+** tRPC API endpoints
- **8** database tables
- **5** user permission levels
- **1,131** products ready to import
- **100%** feature complete

---

## 🎯 For Your Team (Windows + Chromebooks)

### Recommended Setup

**Best Option:** Cloud Deployment (Vercel + PlanetScale)

**Why?**
- ✅ Works on Windows, HP, AND Chromebooks
- ✅ Free tier covers small teams
- ✅ No local installation needed (except for admins)
- ✅ Access from anywhere
- ✅ Automatic HTTPS & backups

**Setup Time:** 15 minutes
**Cost:** $0 (free tier)

**See:** [DEPLOYMENT_OPTIONS.md](DEPLOYMENT_OPTIONS.md)

---

## 📚 Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [README.md](README.md) | Overview & quick links | Everyone |
| [QUICKSTART.md](QUICKSTART.md) | Fast local setup | Windows users |
| [CLOUD_DEPLOY.md](CLOUD_DEPLOY.md) | Cloud deployment | Everyone |
| [DEPLOYMENT_OPTIONS.md](DEPLOYMENT_OPTIONS.md) | Compare all options | Decision makers |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Complete manual | Technical admins |

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 19 + TypeScript
- TailwindCSS 4
- tRPC for type-safe APIs
- Wouter for routing
- Recharts for analytics

**Backend:**
- Express + tRPC
- MySQL 8.0 (via Drizzle ORM)
- OAuth authentication
- OpenAI integration (optional)

**Deployment:**
- Docker Compose (local)
- Vercel (cloud frontend)
- PlanetScale (cloud database)

### Database Schema

```
users (authentication, roles)
├── products (steering rack catalog)
├── purchase_orders (PO management)
│   └── po_line_items
├── vendors (supplier info)
├── form_templates (custom forms)
└── form_submissions (filled forms)
```

---

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Everything - full system access |
| **Manager** | Manage products, stock, POs, analytics |
| **Shop Floor** | View products, update stock, fill forms |
| **Sales** | View products, AI search, view stock |
| **Read-Only** | View products and stock only |

---

## 🚀 Getting Started

### Prerequisites

**For Local Setup:**
- Node.js 18+
- pnpm
- Docker (Windows/Mac only)

**For Cloud Setup:**
- GitHub account
- Vercel account (free)
- PlanetScale account (free)

### Installation

**Local (Windows):**

```bash
# Clone repository
git clone https://github.com/brebuilds/tamtam.git
cd tamtam

# Quick setup
./scripts/setup.sh

# Or manual
pnpm install
docker-compose up -d
pnpm run db:push
pnpm run dev
```

**Cloud (All Devices):**

```bash
# 1. Create PlanetScale database
# 2. Push code to GitHub (already done!)
# 3. Deploy to Vercel
# 4. Configure environment variables
# 5. Access from anywhere!
```

**Detailed steps:** [CLOUD_DEPLOY.md](CLOUD_DEPLOY.md)

---

## 📦 Import Your Products

Have the Access database export?

```bash
# 1. Place CSV in repo
cp /path/to/quality_master.csv .

# 2. Update import_data.py path (line 237)

# 3. Run import
python3 import_data.py
```

Imports **1,131+** products with full specifications!

---

## 🎨 Features Showcase

### Dashboard
- Real-time statistics
- Low stock alerts
- Recent products
- Quick actions (permission-based)

### Product Management
- Add/edit/delete products
- Image galleries
- 40+ specification fields
- Bulk operations

### Analytics
- Interactive charts (line, bar, pie)
- KPI tracking
- Category distribution
- Top products by value
- PO status breakdown

### Custom Forms
- Visual form builder
- 9 field types
- Form versioning
- Submission tracking
- Status workflow

### Data Export
- CSV for Excel/Sheets
- JSON for migrations
- Multi-table selection
- Batch export

---

## 🔐 Security

- OAuth2 authentication
- JWT session management
- Role-based access control (RBAC)
- SQL injection protection (ORM)
- HTTPS ready
- Environment variable secrets
- CSRF protection

---

## 🌐 Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers
- ✅ Chromebook browsers

---

## 📱 Mobile Support

- PWA installable
- Responsive design
- Touch-optimized
- Barcode scanner (camera access)
- Works offline (coming soon)

---

## 🐛 Troubleshooting

### Common Issues

**Port 3306 in use:**
```bash
# Stop local MySQL or change docker-compose.yml port
docker-compose down
# Edit docker-compose.yml: "3307:3306"
```

**Database connection failed:**
```bash
# Check MySQL is running
docker-compose ps
docker-compose logs mysql
```

**Chromebook can't run app:**
- Use cloud deployment (Vercel + PlanetScale)
- Or access via LAN from Windows host

**Full troubleshooting:** [SETUP_GUIDE.md](SETUP_GUIDE.md#troubleshooting)

---

## 📞 Support

1. Check documentation in this repo
2. Review logs: `docker-compose logs -f`
3. Check application console (F12 in browser)
4. Verify environment variables in `.env`

---

## 🗺️ Roadmap

✅ **Completed (100%):**
- All core features
- Analytics dashboard
- Data export
- Custom forms system
- Complete documentation
- Cloud deployment ready

**Future Enhancements:**
- Offline PWA sync
- Mobile apps (iOS/Android)
- Advanced reporting
- Multi-location support
- Barcode label printing

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

Built with:
- React & TypeScript
- tRPC for type safety
- Drizzle ORM
- TailwindCSS
- Recharts for analytics
- And many other amazing open-source projects!

---

## 🎉 Ready to Deploy!

1. **Choose your setup:** Local Docker or Cloud (Vercel)
2. **Follow the guide:** [QUICKSTART.md](QUICKSTART.md) or [CLOUD_DEPLOY.md](CLOUD_DEPLOY.md)
3. **Import products:** Run `import_data.py` with your CSV
4. **Create admin user:** Update role in database
5. **Start managing inventory!** 🚀

---

**Questions?** Check the docs or review the setup guides!

**System Status:** ✅ Production Ready
**Completion:** 100%
**Version:** 1.0.0
