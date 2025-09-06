/*
  Warnings:

  - You are about to alter the column `criteria` on the `Prophecy` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `criteriaMatched` on the `Prophecy` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `socialSignals` on the `Prophecy` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - Made the column `criteria` on table `Prophecy` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Prophecy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenId" TEXT NOT NULL,
    "signalHash" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "rank" INTEGER NOT NULL,
    "txHash" TEXT,
    "postedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "criteria" JSONB,
    "thesis" TEXT,
    "narrativeScore" REAL,
    "criteriaMatched" JSONB,
    "socialSignals" JSONB,
    CONSTRAINT "Prophecy_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Prophecy" ("criteria", "criteriaMatched", "id", "narrativeScore", "postedAt", "rank", "score", "signalHash", "socialSignals", "thesis", "tokenId", "txHash") SELECT "criteria", "criteriaMatched", "id", "narrativeScore", "postedAt", "rank", "score", "signalHash", "socialSignals", "thesis", "tokenId", "txHash" FROM "Prophecy";
DROP TABLE "Prophecy";
ALTER TABLE "new_Prophecy" RENAME TO "Prophecy";
CREATE UNIQUE INDEX "Prophecy_signalHash_key" ON "Prophecy"("signalHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
