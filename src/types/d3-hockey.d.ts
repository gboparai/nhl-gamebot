declare module 'd3-hockey/dist/d3-hockey.es.js' {
  export interface ShotEvent {
    coordinates: { x: number; y: number };
    type?: 'goal' | 'shot' | 'blocked' | 'missed';
    player?: string;
    shotType?: string;
    period?: number;
    timeInPeriod?: string;
    teamAbbrev?: string;
    teamColor?: string;
  }

  export interface RinkOptions {
    color?: (d: any) => string;
    radius?: number;
    opacity?: number;
    zIndex?: number;
    animate?: boolean;
    id?: string;
  }

  export interface HexbinOptions {
    radius?: number;
    opacity?: number;
    animate?: boolean;
  }

  export class Rink {
    constructor(selector: string);
    render(): this;
    addEvents(events: ShotEvent[], options?: RinkOptions): this;
    addHexbin(shots: ShotEvent[], options?: HexbinOptions): this;
  }

  export class NHLDataManager {
    constructor();
    // Add methods as needed
  }
}
