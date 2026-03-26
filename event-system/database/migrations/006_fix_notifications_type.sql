IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.notifications') 
    AND name = 'type'
)
BEGIN
    ALTER TABLE notifications ADD type NVARCHAR(50);
END
GO
