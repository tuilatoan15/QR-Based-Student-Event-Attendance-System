-- Migration to add organizer_info table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='organizer_info' and xtype='U')
BEGIN
    CREATE TABLE organizer_info (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT UNIQUE,
        organization_name NVARCHAR(255),
        position NVARCHAR(255),
        phone VARCHAR(20),
        bio NVARCHAR(MAX),
        website NVARCHAR(255),
        approval_status VARCHAR(20) DEFAULT 'pending',
        approved_by INT NULL,
        approved_at DATETIME NULL,
        reject_reason NVARCHAR(255) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),

        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
    );
END
