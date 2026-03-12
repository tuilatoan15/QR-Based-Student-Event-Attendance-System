IF COL_LENGTH('dbo.events', 'google_sheet_id') IS NULL
ALTER TABLE events
ADD google_sheet_id NVARCHAR(255) NULL,
    google_sheet_name NVARCHAR(255) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_events_google_sheet_id' AND object_id = OBJECT_ID('dbo.events'))
  CREATE INDEX idx_events_google_sheet_id
  ON events(google_sheet_id);

