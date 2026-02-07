import type { SQLiteDatabase } from "expo-sqlite";
import type {
  Tag,
  CreateTagInput,
  UpdateTagInput,
  ITagRepository,
} from "@/specs/001-meditation-app/contracts/repository-interfaces";

interface TagRow {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

const MAX_TAG_NAME_LENGTH = 50;

export class TagRepository implements ITagRepository {
  constructor(private db: SQLiteDatabase) {}

  async getAll(): Promise<Tag[]> {
    const rows = await this.db.getAllAsync<TagRow>(
      `SELECT * FROM tags ORDER BY name ASC`
    );

    return rows.map((r) => this.mapRow(r));
  }

  async getById(id: number): Promise<Tag | null> {
    const row = await this.db.getFirstAsync<TagRow>(
      `SELECT * FROM tags WHERE id = ?`,
      [id]
    );

    if (!row) return null;
    return this.mapRow(row);
  }

  async create(input: CreateTagInput): Promise<number> {
    const trimmedName = input.name.trim().slice(0, MAX_TAG_NAME_LENGTH);
    if (trimmedName.length === 0) {
      throw new Error("Tag name cannot be empty");
    }
    const result = await this.db.runAsync(
      `INSERT INTO tags (name) VALUES (?)`,
      [trimmedName]
    );
    return result.lastInsertRowId;
  }

  async update(input: UpdateTagInput): Promise<void> {
    const trimmedName = input.name.trim().slice(0, MAX_TAG_NAME_LENGTH);
    if (trimmedName.length === 0) {
      throw new Error("Tag name cannot be empty");
    }
    await this.db.runAsync(
      `UPDATE tags SET name = ?, updated_at = datetime('now') WHERE id = ?`,
      [trimmedName, input.id]
    );
  }

  async delete(id: number): Promise<void> {
    // CASCADE will remove session_tags entries automatically
    await this.db.runAsync(`DELETE FROM tags WHERE id = ?`, [id]);
  }

  private mapRow(row: TagRow): Tag {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
