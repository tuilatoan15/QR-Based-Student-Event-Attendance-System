IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.notifications') 
    AND name = 'event_id'
)
BEGIN
    ALTER TABLE notifications ADD event_id INT NULL;
END
GO
