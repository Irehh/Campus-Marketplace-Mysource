-- AlterTable
ALTER TABLE `business` ADD COLUMN `disabledReason` TEXT NULL,
    ADD COLUMN `isDisabled` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `disabledReason` TEXT NULL,
    ADD COLUMN `isDisabled` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `role` ENUM('USER', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'USER';
