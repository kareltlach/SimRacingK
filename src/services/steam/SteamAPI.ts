export interface SteamGameSummary {
  appId: number;
  name: string;
  playtimeHours: number;
  iconUrl?: string;
}

export class SteamAPI {
  public static async getPlayerSummary(steamId: string, apiKey: string): Promise<any> {
    try {
      const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`;
      const res = await fetch(url);
      const json: any = await res.json();
      return json.response?.players?.[0] || null;
    } catch {
      return null;
    }
  }

  public static async getOwnedGames(steamId: string, apiKey: string): Promise<SteamGameSummary[]> {
    try {
      const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&format=json`;
      const res = await fetch(url);
      const json: any = await res.json();
      const games = json.response?.games || [];

      return games.map((g: any) => ({
        appId: g.appid,
        name: g.name,
        playtimeHours: Math.round((g.playtime_forever || 0) / 60),
      }));
    } catch {
      return [];
    }
  }
}
