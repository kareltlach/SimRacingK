import { SteamAPI, SteamGameSummary } from './SteamAPI';

export class SteamProfileService {
  private currentProfile: any = null;

  public async loadProfile(steamId: string, apiKey: string): Promise<any> {
    const player = await SteamAPI.getPlayerSummary(steamId, apiKey);
    const games = await SteamAPI.getOwnedGames(steamId, apiKey);

    this.currentProfile = {
      steamId,
      nickname: player?.personaname || 'Apex Pilot',
      avatarUrl: player?.avatarfull || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      profileUrl: player?.profileurl || '',
      totalHours: games.reduce((acc: number, g: SteamGameSummary) => acc + g.playtimeHours, 0),
      ownedGames: games,
    };
    return this.currentProfile;
  }

  public getProfile(): any {
    return this.currentProfile;
  }
}
