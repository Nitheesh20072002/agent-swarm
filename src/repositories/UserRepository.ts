
import { query, transaction } from '../database/client';
import { NotFoundError } from '../types';

export interface User {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  name?: string;
  passwordHash: string;
}

export interface UpdateUserData {
  name?: string;
  passwordHash?: string;
}

export class UserRepository {
  /**
   * Create a new user
   * SQL: INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING *
   */
  async create(data: CreateUserData): Promise<User> {
    const sql = `
      INSERT INTO users (email, name, password_hash)
      VALUES ($1, $2, $3)
      RETURNING 
        id,
        email,
        name,
        password_hash as "passwordHash",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await query<User>(sql, [
      data.email,
      data.name || null,
      data.passwordHash,
    ]);

    return result.rows[0];
  }

  /**
   * Find user by ID
   * SQL: SELECT * FROM users WHERE id = $1
   */
  async findById(id: string): Promise<User | null> {
    const sql = `
      SELECT 
        id,
        email,
        name,
        password_hash as "passwordHash",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM users
      WHERE id = $1
    `;

    const result = await query<User>(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID or throw
   * SQL: SELECT * FROM users WHERE id = $1
   */
  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }
    return user;
  }

  /**
   * Find user by email
   * SQL: SELECT * FROM users WHERE email = $1
   */
  async findByEmail(email: string): Promise<User | null> {
    const sql = `
      SELECT 
        id,
        email,
        name,
        password_hash as "passwordHash",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM users
      WHERE email = $1
    `;

    const result = await query<User>(sql, [email]);
    return result.rows[0] || null;
  }

  /**
   * Update user
   * SQL: UPDATE users SET ... WHERE id = $1 RETURNING *
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }

    if (data.passwordHash !== undefined) {
      updates.push(`password_hash = $${paramCount++}`);
      values.push(data.passwordHash);
    }

    if (updates.length === 0) {
      // No updates, just return current user
      return this.findByIdOrThrow(id);
    }

    values.push(id);

    const sql = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id,
        email,
        name,
        password_hash as "passwordHash",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await query<User>(sql, values);

    if (result.rows.length === 0) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Delete user
   * SQL: DELETE FROM users WHERE id = $1
   */
  async delete(id: string): Promise<void> {
    const sql = `DELETE FROM users WHERE id = $1`;
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError(`User with id ${id} not found`);
    }
  }

  /**
   * Check if email exists
   * SQL: SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)
   */
  async emailExists(email: string): Promise<boolean> {
    const sql = `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists`;
    const result = await query<{ exists: boolean }>(sql, [email]);
    return result.rows[0].exists;
  }

  /**
   * List all users with pagination
   * SQL: SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2
   */
  async list(limit: number = 50, offset: number = 0): Promise<User[]> {
    const sql = `
      SELECT 
        id,
        email,
        name,
        password_hash as "passwordHash",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await query<User>(sql, [limit, offset]);
    return result.rows;
  }

  /**
   * Count total users
   * SQL: SELECT COUNT(*) FROM users
   */
  async count(): Promise<number> {
    const sql = `SELECT COUNT(*)::int as count FROM users`;
    const result = await query<{ count: number }>(sql);
    return result.rows[0].count;
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
