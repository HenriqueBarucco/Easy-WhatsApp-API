/*
  Warnings:

  - The primary key for the `users_tbl` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `instances_tbl` DROP FOREIGN KEY `instances_tbl_ownerId_fkey`;

-- AlterTable
ALTER TABLE `instances_tbl` MODIFY `ownerId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `users_tbl` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `instances_tbl` ADD CONSTRAINT `instances_tbl_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users_tbl`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
