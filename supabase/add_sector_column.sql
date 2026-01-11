-- Migration: Add sector column to stock_queries table
-- This migration adds sector information to track the industry sector of each stock

ALTER TABLE stock_queries ADD COLUMN IF NOT EXISTS sector TEXT;

CREATE INDEX IF NOT EXISTS idx_stock_queries_sector ON stock_queries(sector);
