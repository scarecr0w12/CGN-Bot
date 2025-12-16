-- Migration: Add slug column to gallery table for SEO-friendly URLs
-- Run: mysql -u root -p skynet < Database/migrations/013_add_gallery_slug.sql

ALTER TABLE `gallery`
ADD COLUMN `slug` VARCHAR(60) NULL DEFAULT NULL AFTER `name`,
ADD INDEX `idx_gallery_slug` (`slug`);
