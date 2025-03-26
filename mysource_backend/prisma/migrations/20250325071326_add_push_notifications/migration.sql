/*
  Warnings:

  - You are about to drop the column `userId` on the `verification` table. All the data in the column will be lost.
  - Added the required column `telegramChatId` to the `Verification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `verification` DROP FOREIGN KEY `Verification_userId_fkey`;

-- AlterTable
ALTER TABLE `verification` DROP COLUMN `userId`,
    ADD COLUMN `telegramChatId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `PushSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `p256dh` VARCHAR(191) NOT NULL,
    `auth` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PushSubscription_endpoint_key`(`endpoint`),
    INDEX `PushSubscription_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Verification_telegramChatId_idx` ON `Verification`(`telegramChatId`);
