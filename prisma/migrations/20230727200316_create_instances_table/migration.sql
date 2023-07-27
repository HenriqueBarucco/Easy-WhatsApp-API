-- CreateTable
CREATE TABLE `instances_tbl` (
    `id` VARCHAR(191) NOT NULL,
    `ownerId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `instances_tbl` ADD CONSTRAINT `instances_tbl_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users_tbl`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
