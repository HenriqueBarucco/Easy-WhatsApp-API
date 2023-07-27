/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `users_tbl` will be added. If there are existing duplicate values, this will fail.
  - The required column `key` was added to the `users_tbl` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE `users_tbl` ADD COLUMN `key` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_tbl_key_key` ON `users_tbl`(`key`);
