-- TamerX Inventory Database Initialization
-- This script runs automatically when MySQL container first starts

-- Set character encoding
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Create database if not exists (should already exist from docker-compose)
CREATE DATABASE IF NOT EXISTS tamerx_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE tamerx_inventory;

-- Display info
SELECT 'TamerX Inventory Database Initialized' AS Status;
SELECT DATABASE() AS CurrentDatabase;
SELECT VERSION() AS MySQLVersion;
