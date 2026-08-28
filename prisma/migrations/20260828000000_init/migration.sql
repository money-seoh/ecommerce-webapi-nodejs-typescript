-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [firstName] NVARCHAR(1000) NOT NULL,
    [lastName] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [mobileNumber] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [User_isActive_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Role] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Role_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Role_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Role_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[UserRole] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [roleId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [UserRole_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [UserRole_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UserRole_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserRole_roleId_idx] ON [dbo].[UserRole]([roleId]);

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;
