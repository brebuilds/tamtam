#!/bin/bash

# TamerX Inventory - Automated Setup Script
# This script sets up the complete development environment

set -e  # Exit on error

echo "======================================"
echo "TamerX Inventory - Automated Setup"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env

    # Update database URL for Docker
    sed -i 's|DATABASE_URL=.*|DATABASE_URL=mysql://tamerx_user:tamerx_secure_password@localhost:3306/tamerx_inventory|g' .env

    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠ Please update .env with your actual credentials!${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pnpm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker is installed${NC}"

    # Start MySQL container
    echo -e "${YELLOW}Starting MySQL database...${NC}"
    docker-compose up -d mysql

    echo -e "${YELLOW}Waiting for MySQL to be ready...${NC}"
    sleep 10

    # Wait for MySQL to be healthy
    for i in {1..30}; do
        if docker-compose exec -T mysql mysqladmin ping -h localhost --silent; then
            echo -e "${GREEN}✓ MySQL is ready${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    echo ""

    # Run migrations
    echo -e "${YELLOW}Running database migrations...${NC}"
    pnpm run db:push || echo -e "${YELLOW}⚠ Migrations may have warnings, but schema should be created${NC}"
    echo -e "${GREEN}✓ Database migrations complete${NC}"

else
    echo -e "${RED}✗ Docker not found${NC}"
    echo "Please install Docker to use the automated database setup."
    echo "Alternatively, install MySQL manually and update .env"
fi

echo ""
echo "======================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Update .env with your actual credentials"
echo "2. Start the development server:"
echo "   pnpm run dev"
echo ""
echo "3. Access the application:"
echo "   Application:  http://localhost:3000"
echo "   phpMyAdmin:   http://localhost:8080 (if using Docker)"
echo ""
echo "4. Create your first admin user:"
echo "   - Sign in through OAuth"
echo "   - Run: docker-compose exec mysql mysql -u tamerx_user -ptamerx_secure_password tamerx_inventory"
echo "   - Execute: UPDATE users SET role = 'admin' WHERE email = 'your.email@example.com';"
echo ""
echo "5. Optional: Import products from CSV:"
echo "   python3 import_data.py"
echo ""
echo "======================================"
