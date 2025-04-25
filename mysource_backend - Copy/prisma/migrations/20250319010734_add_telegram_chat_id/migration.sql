/*
  Warnings:

  - You are about to alter the column `role` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.
  - Made the column `name` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `telegramChatId` VARCHAR(191) NULL,
    MODIFY `name` VARCHAR(191) NOT NULL,
    MODIFY `campus` VARCHAR(191) NOT NULL DEFAULT 'default',
    MODIFY `needsCampusSelection` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `role` VARCHAR(191) NOT NULL DEFAULT 'user';
