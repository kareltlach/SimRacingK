export interface TrackData {
  id: string
  name: string
  circuit: string
  lengthKm: string
  turns: number
  country: string
  s1Avg: string
  s2Avg: string
  s3Avg: string
  optLap: string
  svgPath: string
  sectors: { s1: string; s2: string; s3: string }
}

export const SUPPORTED_TRACKS: Record<string, TrackData> = {
  brands_hatch: {
    id: 'brands_hatch',
    name: 'Brands Hatch Circuit',
    circuit: 'Brands Hatch Circuit (Grã-Bretanha)',
    lengthKm: '3.908 KM',
    turns: 9,
    country: 'GB',
    s1Avg: '26.850',
    s2Avg: '32.110',
    s3Avg: '24.301',
    optLap: '1:23.261',
    svgPath: 'M 70 190 C 110 190 140 190 170 190 C 200 190 220 180 230 160 C 240 140 230 110 210 95 C 190 80 180 60 200 45 C 220 30 270 40 310 65 C 350 90 370 120 360 150 C 350 180 320 200 280 205 C 230 210 150 210 90 210 C 60 210 50 190 70 190 Z',
    sectors: {
      s1: 'M 70 190 C 110 190 140 190 170 190 C 200 190 220 180 230 160',
      s2: 'M 230 160 C 240 140 230 110 210 95 C 190 80 180 60 200 45 C 220 30 270 40 310 65',
      s3: 'M 310 65 C 350 90 370 120 360 150 C 350 180 320 200 280 205 C 230 210 150 210 90 210 C 60 210 50 190 70 190 Z'
    }
  },
  monza: {
    id: 'monza',
    name: 'Monza',
    circuit: 'Autodromo Nazionale Monza',
    lengthKm: '5.793 KM',
    turns: 11,
    country: 'IT',
    s1Avg: '27.421',
    s2Avg: '38.109',
    s3Avg: '41.570',
    optLap: '1:47.100',
    // Traçado autêntico de Monza: reta principal na base indo para direita,
    // chicane Rettifilo subindo à esquerda para Curva Grande, descendo para Variante della Roggia,
    // Lesmo 1 e 2 no topo à direita, descida para Variante Ascari e longa Curva Parabolica retornando à reta.
    svgPath: 'M 70 190 L 290 190 C 330 190 350 165 340 135 C 330 100 295 90 260 85 L 210 85 C 190 85 180 75 185 60 C 190 45 220 40 250 40 L 285 40 C 310 40 325 55 330 75 L 340 100 C 345 110 355 115 365 110 C 375 105 380 90 370 70 C 355 35 320 25 270 25 L 210 25 C 150 25 130 50 135 90 L 140 120 C 145 140 130 150 100 150 L 70 150 C 45 150 40 170 50 185 C 55 190 62 190 70 190 Z',
    sectors: {
      s1: 'M 70 190 L 290 190 C 330 190 350 165 340 135 C 330 100 295 90 260 85',
      s2: 'M 260 85 L 210 85 C 190 85 180 75 185 60 C 190 45 220 40 250 40 L 285 40 C 310 40 325 55 330 75',
      s3: 'M 330 75 L 340 100 C 345 110 355 115 365 110 C 375 105 380 90 370 70 C 355 35 320 25 270 25 L 210 25 C 150 25 130 50 135 90 L 140 120 C 145 140 130 150 100 150 L 70 150 C 45 150 40 170 50 185 C 55 190 62 190 70 190 Z'
    }
  },
  spa: {
    id: 'spa',
    name: 'Spa-Francorchamps',
    circuit: 'Circuit de Spa-Francorchamps',
    lengthKm: '7.004 KM',
    turns: 19,
    country: 'BE',
    s1Avg: '41.250',
    s2Avg: '58.420',
    s3Avg: '37.830',
    optLap: '2:17.500',
    // Traçado autêntico de Spa-Francorchamps:
    // Começa na reta com La Source (hairpin apertado à direita no topo esquerdo),
    // desce até a descida da Eau Rouge / Raidillon, sobe a reta Kemmel até Les Combes (topo direito),
    // desce por Malmedy, Rivage, curva Bruxelles, descendo para Pouhon (dupla esquerda rápida),
    // Fagnes, Campus, Stavelot e aceleração máxima por Blanchimont até a Chicane Bus Stop e reta principal.
    svgPath: 'M 75 140 L 70 85 C 68 70 80 60 95 65 C 105 70 100 85 92 95 L 98 120 C 105 135 120 140 145 130 L 250 80 C 275 68 290 65 305 75 L 325 90 C 335 100 325 115 310 120 L 275 130 C 260 135 255 145 265 155 C 275 165 290 170 280 185 C 270 200 245 205 220 195 L 180 180 C 160 170 145 175 140 190 C 135 205 145 215 160 215 L 210 215 C 235 215 250 220 235 230 C 215 238 150 235 110 215 C 80 200 70 170 75 140 Z',
    sectors: {
      s1: 'M 75 140 L 70 85 C 68 70 80 60 95 65 C 105 70 100 85 92 95 L 98 120 C 105 135 120 140 145 130 L 250 80',
      s2: 'M 250 80 C 275 68 290 65 305 75 L 325 90 C 335 100 325 115 310 120 L 275 130 C 260 135 255 145 265 155 C 275 165 290 170 280 185',
      s3: 'M 280 185 C 270 200 245 205 220 195 L 180 180 C 160 170 145 175 140 190 C 135 205 145 215 160 215 L 210 215 C 235 215 250 220 235 230 C 215 238 150 235 110 215 C 80 200 70 170 75 140 Z'
    }
  },
  silverstone: {
    id: 'silverstone',
    name: 'Silverstone',
    circuit: 'Silverstone Grand Prix Circuit',
    lengthKm: '5.891 KM',
    turns: 18,
    country: 'GB',
    s1Avg: '28.110',
    s2Avg: '42.340',
    s3Avg: '26.850',
    optLap: '1:37.300',
    svgPath: 'M 90 190 L 140 180 C 170 170 190 130 180 100 L 170 70 C 180 40 220 40 250 60 L 320 90 C 350 110 370 140 350 170 L 310 190 C 270 210 220 200 180 200 L 110 210 C 80 210 70 200 90 190 Z',
    sectors: {
      s1: 'M 90 190 L 140 180 C 170 170 190 130 180 100',
      s2: 'M 180 100 L 170 70 C 180 40 220 40 250 60 L 320 90',
      s3: 'M 320 90 C 350 110 370 140 350 170 L 310 190 C 270 210 220 200 180 200 L 110 210 C 80 210 70 200 90 190 Z'
    }
  },
  nurburgring: {
    id: 'nurburgring',
    name: 'Nürburgring GP',
    circuit: 'Nürburgring Grand-Prix Strecke',
    lengthKm: '5.148 KM',
    turns: 16,
    country: 'DE',
    s1Avg: '32.140',
    s2Avg: '44.820',
    s3Avg: '36.540',
    optLap: '1:53.500',
    svgPath: 'M 100 170 L 160 170 C 200 170 210 130 190 100 L 170 80 C 190 50 240 50 270 80 L 310 110 C 340 130 360 160 330 190 L 260 200 C 200 210 160 190 100 170 Z',
    sectors: {
      s1: 'M 100 170 L 160 170 C 200 170 210 130 190 100',
      s2: 'M 190 100 L 170 80 C 190 50 240 50 270 80 L 310 110',
      s3: 'M 310 110 C 340 130 360 160 330 190 L 260 200 C 200 210 160 190 100 170 Z'
    }
  },
  zandvoort: {
    id: 'zandvoort',
    name: 'Zandvoort',
    circuit: 'Circuit Zandvoort (Holanda)',
    lengthKm: '4.259 KM',
    turns: 14,
    country: 'NL',
    s1Avg: '24.950',
    s2Avg: '34.820',
    s3Avg: '23.410',
    optLap: '1:33.180',
    svgPath: 'M 80 180 C 130 180 180 170 210 150 C 240 130 250 90 220 70 C 190 50 210 30 250 40 C 290 50 330 80 340 110 C 350 140 330 170 300 190 C 260 210 160 210 100 210 C 70 210 60 190 80 180 Z',
    sectors: {
      s1: 'M 80 180 C 130 180 180 170 210 150 C 240 130 250 90 220 70',
      s2: 'M 220 70 C 190 50 210 30 250 40 C 290 50 330 80 340 110',
      s3: 'M 340 110 C 350 140 330 170 300 190 C 260 210 160 210 100 210 C 70 210 60 190 80 180 Z'
    }
  },
  misano: {
    id: 'misano',
    name: 'Misano World Circuit',
    circuit: 'Misano World Circuit Marco Simoncelli',
    lengthKm: '4.226 KM',
    turns: 16,
    country: 'IT',
    s1Avg: '23.820',
    s2Avg: '39.410',
    s3Avg: '29.908',
    optLap: '1:33.138',
    // Traçado autêntico de Misano (sentido horário):
    // Reta principal na base, Variante del Parco (T1-T2-T3) subindo em chicane fluida,
    // Curva del Rio (T4-T5) subindo à esquerda, reta até a Curva della Quercia (T8 - hairpin à esquerda),
    // Curva del Tramonto (T10 - curva fechada para a direita levando à longa reta dos fundos),
    // Curvone (T11 - pé embaixo para a direita), Curva del Carro (T14 - hairpin fechado para a direita)
    // e Misano (T15-T16) fechando em direção à reta principal.
    svgPath: 'M 100 200 L 260 200 C 290 200 305 185 300 165 L 290 145 C 285 130 295 120 310 120 L 330 120 C 350 120 360 100 345 80 L 300 45 C 280 30 240 40 220 60 L 195 85 C 185 95 165 95 155 85 L 140 70 C 120 50 85 60 75 85 L 60 135 C 50 165 70 200 100 200 Z',
    sectors: {
      s1: 'M 100 200 L 260 200 C 290 200 305 185 300 165 L 290 145',
      s2: 'M 290 145 C 285 130 295 120 310 120 L 330 120 C 350 120 360 100 345 80 L 300 45 C 280 30 240 40 220 60',
      s3: 'M 220 60 L 195 85 C 185 95 165 95 155 85 L 140 70 C 120 50 85 60 75 85 L 60 135 C 50 165 70 200 100 200 Z'
    }
  },
  paul_ricard: {
    id: 'paul_ricard',
    name: 'Paul Ricard',
    circuit: 'Circuit Paul Ricard (Le Castellet)',
    lengthKm: '5.770 KM',
    turns: 15,
    country: 'FR',
    s1Avg: '31.420',
    s2Avg: '42.110',
    s3Avg: '39.800',
    optLap: '1:53.330',
    svgPath: 'M 60 190 L 330 190 C 360 190 370 170 355 150 L 280 85 C 265 70 245 70 230 85 L 210 105 C 195 120 175 120 160 105 L 140 85 C 125 70 105 70 90 85 L 50 130 C 35 150 40 190 60 190 Z',
    sectors: {
      s1: 'M 60 190 L 330 190',
      s2: 'M 330 190 C 360 190 370 170 355 150 L 280 85 C 265 70 245 70 230 85',
      s3: 'M 230 85 L 210 105 C 195 120 175 120 160 105 L 140 85 C 125 70 105 70 90 85 L 50 130 C 35 150 40 190 60 190 Z'
    }
  },
  barcelona: {
    id: 'barcelona',
    name: 'Barcelona-Catalunya',
    circuit: 'Circuit de Barcelona-Catalunya',
    lengthKm: '4.675 KM',
    turns: 16,
    country: 'ES',
    s1Avg: '26.900',
    s2Avg: '36.800',
    s3Avg: '39.100',
    optLap: '1:42.800',
    svgPath: 'M 70 190 L 280 190 C 320 190 340 160 320 130 L 290 100 C 275 85 280 65 300 55 L 320 45 C 340 35 330 15 300 20 L 230 35 C 200 40 180 65 170 95 L 155 135 C 145 160 120 165 95 155 L 70 145 C 45 135 35 165 50 185 C 55 190 62 190 70 190 Z',
    sectors: {
      s1: 'M 70 190 L 280 190 C 320 190 340 160 320 130',
      s2: 'M 320 130 L 290 100 C 275 85 280 65 300 55 L 320 45 C 340 35 330 15 300 20',
      s3: 'M 300 20 L 230 35 C 200 40 180 65 170 95 L 155 135 C 145 160 120 165 95 155 L 70 145 C 45 135 35 165 50 185 C 55 190 62 190 70 190 Z'
    }
  },
  interlagos: {
    id: 'interlagos',
    name: 'Interlagos',
    circuit: 'Autódromo José Carlos Pace (Brasil)',
    lengthKm: '4.309 KM',
    turns: 15,
    country: 'BR',
    s1Avg: '23.410',
    s2Avg: '39.820',
    s3Avg: '26.970',
    optLap: '1:30.200',
    svgPath: 'M 110 60 C 140 40 190 50 220 80 L 260 130 C 290 170 330 180 350 160 L 370 180 C 360 220 310 220 260 190 L 180 150 C 140 120 100 100 80 80 C 70 60 90 60 110 60 Z',
    sectors: {
      s1: 'M 110 60 C 140 40 190 50 220 80',
      s2: 'M 220 80 L 260 130 C 290 170 330 180 350 160',
      s3: 'M 350 160 L 370 180 C 360 220 310 220 260 190 L 180 150 C 140 120 100 100 80 80 C 70 60 90 60 110 60 Z'
    }
  }
}

/**
 * Normaliza o nome da pista vindo de qualquer simulador (ACC, AC, Forza, etc.)
 * para corresponder à chave cadastrada no SUPPORTED_TRACKS
 */
export function normalizeTrackId(rawName: string | undefined | null): string {
  if (!rawName) return ''
  const clean = rawName.toLowerCase().replace(/[^a-z0-9]/g, '_')

  if (clean.includes('brand') || clean.includes('hatch')) return 'brands_hatch'
  if (clean.includes('monza')) return 'monza'
  if (clean.includes('spa') || clean.includes('francorchamps')) return 'spa'
  if (clean.includes('silverstone')) return 'silverstone'
  if (clean.includes('nurburg') || clean.includes('nuerburg')) return 'nurburgring'
  if (clean.includes('zandvoort')) return 'zandvoort'
  if (clean.includes('misano') || clean.includes('simoncelli')) return 'misano'
  if (clean.includes('ricard') || clean.includes('castellet')) return 'paul_ricard'
  if (clean.includes('barcelona') || clean.includes('catalunya')) return 'barcelona'
  if (clean.includes('interlagos') || clean.includes('pace') || clean.includes('sao_paulo')) return 'interlagos'

  return 'monza'
}
