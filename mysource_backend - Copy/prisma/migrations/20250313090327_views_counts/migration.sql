/*
  Warnings:

  - You are about to drop the column `link` on the `business` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `business` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `business` DROP COLUMN `link`,
    DROP COLUMN `phone`,
    ADD COLUMN `viewCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `product` DROP COLUMN `link`,
    DROP COLUMN `phone`,
    ADD COLUMN `viewCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `lastSeen` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `website` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `View` (
    `id` VARCHAR(191) NOT NULL,
    `visitorId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `businessId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `View_productId_idx`(`productId`),
    INDEX `View_businessId_idx`(`businessId`),
    UNIQUE INDEX `View_visitorId_productId_key`(`visitorId`, `productId`),
    UNIQUE INDEX `View_visitorId_businessId_key`(`visitorId`, `businessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `View` ADD CONSTRAINT `View_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `View` ADD CONSTRAINT `View_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
