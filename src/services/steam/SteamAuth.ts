export class SteamAuth {
  public static getLoginUrl(realm = 'http://localhost:8777'): string {
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': `${realm}/auth/steam/callback`,
      'openid.realm': realm,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });
    return `https://steamcommunity.com/openid/login?${params.toString()}`;
  }

  public static extractSteamId(claimedId: string): string | null {
    const match = claimedId.match(/https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)/);
    return match ? match[1] : null;
  }
}
