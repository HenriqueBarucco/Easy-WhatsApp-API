/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `users_tbl` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `users_tbl_token_key` ON `users_tbl`(`token`);
