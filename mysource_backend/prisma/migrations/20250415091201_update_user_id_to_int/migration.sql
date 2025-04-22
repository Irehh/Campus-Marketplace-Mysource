/*
  Warnings:

  - You are about to alter the column `itemId` on the `favorite` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `userId` on the `pushsubscription` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `favorite` MODIFY `itemId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `pushsubscription` MODIFY `userId` INTEGER NOT NULL;
