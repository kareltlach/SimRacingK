/**
 * ProfileRepository — Steam profiles & HUD layouts
 */

import { getDatabase, cachedStmt } from '../Database';
import type { SteamProfile, HudLayout } from '../../shared/types';

// ─── Repository ─────────────────────────────────────────────

export class ProfileRepository {
  /**
   * Upsert a Steam profile.  If the `steam_id` already exists the
   * mutable columns (nickname, avatar, API key) are updated in place.
   */
  createOrUpdateProfile(profile: SteamProfile): void {
    const stmt = cachedStmt(
      `INSERT INTO profiles (steam_id, nickname, avatar_url, steam_api_key)
       VALUES (@steam_id, @nickname, @avatar_url, @steam_api_key)
       ON CONFLICT(steam_id) DO UPDATE SET
         nickname    = excluded.nickname,
         avatar_url  = excluded.avatar_url,
         steam_api_key = COALESCE(excluded.steam_api_key, profiles.steam_api_key)`,
    );

    stmt.run({
      steam_id: profile.steam_id,
      nickname: profile.nickname,
      avatar_url: profile.avatar_url,
      steam_api_key: profile.steam_api_key ?? null,
    });
  }

  /**
   * Fetch a profile by Steam ID.
   */
  getProfile(steamId: string): SteamProfile | null {
    const stmt = cachedStmt<SteamProfile>('SELECT * FROM profiles WHERE steam_id = ?');
    return (stmt.get(steamId) as SteamProfile | undefined) ?? null;
  }

  // ── HUD layouts ─────────────────────────────────────────

  /**
   * Insert or update a HUD layout.
   *
   * - When `layout.id` is provided an UPDATE is performed.
   * - Otherwise a new row is inserted and the generated `id` is
   *   returned on the result object.
   */
  saveHudLayout(layout: HudLayout): HudLayout {
    const db = getDatabase();

    if (layout.id != null) {
      const stmt = cachedStmt(
        `UPDATE hud_layouts
         SET name         = @name,
             game_rule    = @game_rule,
             car_rule     = @car_rule,
             widgets_json = @widgets_json,
             resolution   = @resolution
         WHERE id = @id`,
      );
      stmt.run({
        id: layout.id,
        name: layout.name,
        game_rule: layout.game_rule ?? null,
        car_rule: layout.car_rule ?? null,
        widgets_json: layout.widgets_json,
        resolution: layout.resolution ?? '1920x1080',
      });
      return layout;
    }

    const stmt = cachedStmt(
      `INSERT INTO hud_layouts (name, game_rule, car_rule, widgets_json, resolution)
       VALUES (@name, @game_rule, @car_rule, @widgets_json, @resolution)`,
    );

    const result = stmt.run({
      name: layout.name,
      game_rule: layout.game_rule ?? null,
      car_rule: layout.car_rule ?? null,
      widgets_json: layout.widgets_json,
      resolution: layout.resolution ?? '1920x1080',
    });

    return { ...layout, id: result.lastInsertRowid as number };
  }

  /**
   * Return every saved HUD layout.
   */
  getHudLayouts(): HudLayout[] {
    const stmt = cachedStmt<HudLayout>('SELECT * FROM hud_layouts ORDER BY name ASC');
    return stmt.all() as HudLayout[];
  }

  /**
   * Find the most specific layout matching a game + car context.
   *
   * Priority (first match wins):
   *   1. Exact game_rule AND car_rule match
   *   2. Exact game_rule, any car (car_rule IS NULL)
   *   3. Fallback: any layout with both rules NULL
   */
  getLayoutForContext(gameId: string, carModel: string): HudLayout | null {
    const stmt = cachedStmt<HudLayout>(
      `SELECT * FROM hud_layouts
       WHERE (game_rule = @gameId  AND car_rule = @carModel)
          OR (game_rule = @gameId  AND car_rule IS NULL)
          OR (game_rule IS NULL    AND car_rule IS NULL)
       ORDER BY
         CASE
           WHEN game_rule = @gameId AND car_rule = @carModel THEN 0
           WHEN game_rule = @gameId AND car_rule IS NULL     THEN 1
           ELSE 2
         END
       LIMIT 1`,
    );

    return (stmt.get({ gameId, carModel }) as HudLayout | undefined) ?? null;
  }

  /**
   * Delete a HUD layout by id.
   */
  deleteHudLayout(id: number): void {
    const stmt = cachedStmt('DELETE FROM hud_layouts WHERE id = ?');
    stmt.run(id);
  }
}

// ─── Singleton instance ─────────────────────────────────────
export const profileRepository = new ProfileRepository();
export default profileRepository;
