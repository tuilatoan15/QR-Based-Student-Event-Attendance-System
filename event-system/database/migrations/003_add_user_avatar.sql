USE event_system;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'avatar')
BEGIN
    ALTER TABLE users ADD avatar NVARCHAR(MAX) NULL;
END
GO
