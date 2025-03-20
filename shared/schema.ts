import { pgTable, text, serial, integer, timestamp, varchar, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Favorite events
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  eventId: varchar("event_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    userEventUnique: primaryKey({ columns: [table.userId, table.eventId] }),
  };
});

export const insertFavoriteSchema = createInsertSchema(favorites).pick({
  userId: true,
  eventId: true,
});

// Districts
export const districts = pgTable("districts", {
  id: serial("id").primaryKey(),
  nameJa: varchar("name_ja", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  parentArea: varchar("parent_area", { length: 255 }).notNull(),
  displayOrder: integer("display_order").notNull(),
  value: varchar("value", { length: 255 }).notNull().unique(),
});

export const insertDistrictSchema = createInsertSchema(districts).pick({
  nameJa: true,
  nameEn: true,
  parentArea: true,
  displayOrder: true,
  value: true,
});

// Event and SearchParams interfaces for API communication
export interface Event {
  id: string;
  titleJa: string;
  titleEn: string;
  descriptionJa: string;
  descriptionEn: string;
  startDate: string;
  endDate: string | null;
  location: string;
  district: string;
  imageUrl: string;
}

export interface SearchParams {
  dateFrom: string;
  dateTo: string;
  district?: string;
}

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

export type InsertDistrict = z.infer<typeof insertDistrictSchema>;
export type District = typeof districts.$inferSelect;
