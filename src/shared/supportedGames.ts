export interface SupportedGameMeta {
  id: string
  name: string
  shortName: string
  appId: number
  logoUrl: string
  headerUrl: string
  badgeBg: string
  badgeBorder: string
  processNames: string[]
  adapterKey: string
  memoryMapNames?: string[]
  udpPort?: number
}

export const SUPPORTED_SIM_GAMES: Record<string, SupportedGameMeta> = {
  ac: {
    id: 'ac',
    name: 'Assetto Corsa',
    shortName: 'AC',
    appId: 244210,
    logoUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/244210/header.jpg',
    headerUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/244210/header.jpg',
    badgeBg: '#1e1014',
    badgeBorder: '#e11d48',
    processNames: ['acs.exe', 'assetto_corsa.exe', 'ac.exe', 'contentmanager.exe'],
    adapterKey: 'ac',
    memoryMapNames: ['Local\\acpmf_physics', 'Local\\acpmf_graphics', 'Local\\acpmf_static']
  },
  acc: {
    id: 'acc',
    name: 'Assetto Corsa Competizione',
    shortName: 'ACC',
    appId: 805550,
    logoUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/805550/header.jpg',
    headerUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/805550/header.jpg',
    badgeBg: '#181b28',
    badgeBorder: '#3b82f6',
    processNames: ['acc.exe', 'ac2-win64-shipping.exe', 'acc-win64-shipping.exe'],
    adapterKey: 'acc',
    memoryMapNames: ['Local\\acpmf_physics', 'Local\\acpmf_graphics', 'Local\\acpmf_static']
  },
  acevo: {
    id: 'acevo',
    name: 'Assetto Corsa EVO',
    shortName: 'AC EVO',
    appId: 3058630,
    logoUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3058630/header.jpg',
    headerUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3058630/header.jpg',
    badgeBg: '#210d16',
    badgeBorder: '#f43f5e',
    processNames: ['acevo.exe', 'acevo-win64-shipping.exe', 'ace-win64-shipping.exe'],
    adapterKey: 'acevo',
    memoryMapNames: ['Local\\acpmf_physics_evo', 'Local\\acpmf_physics']
  },
  rally: {
    id: 'rally',
    name: 'Assetto Corsa Rally / EA Sports WRC',
    shortName: 'AC RALLY / WRC',
    appId: 1849250,
    logoUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1849250/header.jpg',
    headerUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1849250/header.jpg',
    badgeBg: '#1c150c',
    badgeBorder: '#f59e0b',
    processNames: ['wrc.exe', 'ea_sports_wrc.exe', 'dirt4.exe', 'dirt2.exe'],
    adapterKey: 'rally',
    udpPort: 20777
  },
  lmu: {
    id: 'lmu',
    name: 'Le Mans Ultimate',
    shortName: 'LMU',
    appId: 2399420,
    logoUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2399420/header.jpg',
    headerUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2399420/header.jpg',
    badgeBg: '#101c24',
    badgeBorder: '#0ea5e9',
    processNames: ['lemansultimate.exe', 'lmu.exe'],
    adapterKey: 'lmu',
    memoryMapNames: ['$rFactor2SMMP_Telemetry$', '$rFactor2SMMP_Scoring$']
  },
  forza: {
    id: 'forza',
    name: 'Forza Motorsport / Horizon',
    shortName: 'FORZA',
    appId: 2440510,
    logoUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2440510/header.jpg',
    headerUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2440510/header.jpg',
    badgeBg: '#161d15',
    badgeBorder: '#10b981',
    processNames: ['forzamotorsport.exe', 'forzahorizon5.exe', 'forzahorizon4.exe'],
    adapterKey: 'forza',
    udpPort: 5300
  }
}
