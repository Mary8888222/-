import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const memories = sqliteTable(
  "memories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    ownerName: text("owner_name").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    location: text("location").notNull().default(""),
    mood: text("mood").notNull().default("平静"),
    memoryDate: text("memory_date").notNull(),
    visibility: text("visibility").notNull().default("private"),
    shareToken: text("share_token"),
    imageKey: text("image_key"),
    imageType: text("image_type"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_memories_user_created").on(table.userId, table.createdAt),
    uniqueIndex("idx_memories_share_token").on(table.shareToken),
  ],
);
