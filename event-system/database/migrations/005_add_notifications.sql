---------------------------------------------------------
-- 10. NOTIFICATIONS
---------------------------------------------------------
IF OBJECT_ID('dbo.notifications', 'U') IS NULL
BEGIN
    CREATE TABLE notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        title NVARCHAR(255) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        is_read BIT DEFAULT 0,
        type NVARCHAR(50), -- 'registration', 'cancellation', 'checkin'
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- Index for faster lookup
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_notifications_user' AND object_id = OBJECT_ID('dbo.notifications'))
    CREATE INDEX idx_notifications_user ON notifications(user_id);
GO
