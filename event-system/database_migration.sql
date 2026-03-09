-- Add Google Sheets columns to events table
ALTER TABLE dbo.events
ADD google_sheet_id NVARCHAR(255) NULL,
    google_sheet_name NVARCHAR(255) NULL;

-- Add index for performance
CREATE INDEX idx_events_created_by ON dbo.events(created_by);
CREATE INDEX idx_events_google_sheet_id ON dbo.events(google_sheet_id);

-- Update existing events (if any) with default values
UPDATE dbo.events
SET google_sheet_id = NULL,
    google_sheet_name = NULL
WHERE google_sheet_id IS NULL;