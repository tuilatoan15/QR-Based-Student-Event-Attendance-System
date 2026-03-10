-- Migration: Add Google Sheets integration to events table
-- Date: March 10, 2026
-- Description: Add google_sheet_id and google_sheet_name columns to events table

USE event_system;
GO

-- Add Google Sheets columns to events table
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.events')
    AND name = 'google_sheet_id'
)
BEGIN
    ALTER TABLE dbo.events
    ADD google_sheet_id NVARCHAR(255) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.events')
    AND name = 'google_sheet_name'
)
BEGIN
    ALTER TABLE dbo.events
    ADD google_sheet_name NVARCHAR(255) NULL;
END;

-- Add index for Google Sheet name lookups
IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.events')
    AND name = 'idx_events_google_sheet_name'
)
BEGIN
    CREATE INDEX idx_events_google_sheet_name ON dbo.events(google_sheet_name);
END;

PRINT 'Google Sheets integration migration completed successfully';