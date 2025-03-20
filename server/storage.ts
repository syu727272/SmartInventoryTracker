import { users, type User, type InsertUser, favorites, InsertFavorite, Favorite, districts, District, InsertDistrict, Event } from "@shared/schema";
import bcrypt from "bcryptjs";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Favorites operations
  getUserFavorites(userId: number): Promise<Event[]>;
  getFavorite(userId: number, eventId: string): Promise<Favorite | undefined>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, eventId: string): Promise<void>;
  
  // Districts operations
  getAllDistricts(): Promise<District[]>;
  getDistrictByValue(value: string): Promise<District | undefined>;
  addDistrict(district: InsertDistrict): Promise<District>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private favorites: Map<string, Favorite>;
  private districts: Map<number, District>;
  private events: Map<string, Event>; // Cache for events
  private currentUserId: number;
  private currentFavoriteId: number;
  private currentDistrictId: number;

  constructor() {
    this.users = new Map();
    this.favorites = new Map();
    this.districts = new Map();
    this.events = new Map();
    this.currentUserId = 1;
    this.currentFavoriteId = 1;
    this.currentDistrictId = 1;
    
    // Initialize with default districts
    this.initializeDistricts();
  }

  // Initialize default districts
  private async initializeDistricts() {
    const districtsData: Omit<InsertDistrict, 'id'>[] = [
      // 23 Wards
      { nameJa: '都心エリア (千代田区、中央区、港区)', nameEn: 'Central Area (Chiyoda, Chuo, Minato)', parentArea: '23区', displayOrder: 1, value: 'central' },
      { nameJa: '新宿・渋谷エリア (新宿区、渋谷区)', nameEn: 'Shinjuku & Shibuya Area', parentArea: '23区', displayOrder: 2, value: 'shinjuku-shibuya' },
      { nameJa: '池袋・上野エリア (豊島区、台東区)', nameEn: 'Ikebukuro & Ueno Area', parentArea: '23区', displayOrder: 3, value: 'ikebukuro-ueno' },
      { nameJa: '城南エリア (品川区、目黒区、大田区)', nameEn: 'South Area (Shinagawa, Meguro, Ota)', parentArea: '23区', displayOrder: 4, value: 'south' },
      { nameJa: '城北・城東エリア (その他23区)', nameEn: 'North & East Area (Other wards)', parentArea: '23区', displayOrder: 5, value: 'north-east' },
      
      // Tama Region
      { nameJa: '多摩西部 (八王子市、立川市など)', nameEn: 'Tama West (Hachioji, Tachikawa, etc.)', parentArea: '多摩地域', displayOrder: 6, value: 'tama-west' },
      { nameJa: '多摩南部 (町田市など)', nameEn: 'Tama South (Machida, etc.)', parentArea: '多摩地域', displayOrder: 7, value: 'tama-south' },
      { nameJa: '多摩北部 (府中市など)', nameEn: 'Tama North (Fuchu, etc.)', parentArea: '多摩地域', displayOrder: 8, value: 'tama-north' }
    ];
    
    for (const district of districtsData) {
      await this.addDistrict(district);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }

  // Favorites operations
  async getUserFavorites(userId: number): Promise<Event[]> {
    const userFavorites = Array.from(this.favorites.values()).filter(
      (fav) => fav.userId === userId
    );
    
    // Return cached events for these favorites
    return userFavorites
      .map((fav) => this.events.get(fav.eventId))
      .filter((event): event is Event => !!event);
  }

  async getFavorite(userId: number, eventId: string): Promise<Favorite | undefined> {
    return Array.from(this.favorites.values()).find(
      (fav) => fav.userId === userId && fav.eventId === eventId
    );
  }

  async addFavorite(favoriteData: InsertFavorite): Promise<Favorite> {
    const id = this.currentFavoriteId++;
    const now = new Date();
    const favorite: Favorite = { 
      ...favoriteData, 
      id, 
      createdAt: now
    };
    
    const key = `${favorite.userId}-${favorite.eventId}`;
    this.favorites.set(key, favorite);
    return favorite;
  }

  async removeFavorite(userId: number, eventId: string): Promise<void> {
    const key = `${userId}-${eventId}`;
    this.favorites.delete(key);
  }

  // Districts operations
  async getAllDistricts(): Promise<District[]> {
    return Array.from(this.districts.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getDistrictByValue(value: string): Promise<District | undefined> {
    return Array.from(this.districts.values()).find(
      (district) => district.value === value
    );
  }

  async addDistrict(districtData: InsertDistrict): Promise<District> {
    const id = this.currentDistrictId++;
    const district: District = { ...districtData, id };
    this.districts.set(id, district);
    return district;
  }

  // Cache an event
  cacheEvent(event: Event): void {
    this.events.set(event.id, event);
  }

  // Cache multiple events
  cacheEvents(events: Event[]): void {
    events.forEach(event => this.cacheEvent(event));
  }
}

// Export a singleton instance
export const storage = new MemStorage();
