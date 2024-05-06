// https://api.nhle.com/stats/rest/en/team/summary
export type TeamSummary = {
    faceoffWinPct: number | null;
    gamesPlayed: number;
    goalsAgainst: number;
    goalsAgainstPerGame: number;
    goalsFor: number;
    goalsForPerGame: number;
    losses: number;
    otLosses: number | null;
    penaltyKillNetPct: number | null;
    penaltyKillPct: number | null;
    pointPct: number;
    points: number;
    powerPlayNetPct: number | null;
    powerPlayPct: number | null;
    regulationAndOtWins: number;
    seasonId: number;
    shotsAgainstPerGame: number | null;
    shotsForPerGame: number | null;
    teamFullName: string;
    teamId: number;
    ties: number | null;
    wins: number;
    winsInRegulation: number;
    winsInShootout: number;
};

export type TeamSummaries = {
    data: TeamSummary[];
};


//https://api-web.nhle.com/v1/gamecenter/2023020180/landing
type Venue = {
    default: string;
};

type TeamInfo = {
    id: number;
    name: {
        default: string;
    };
    abbrev: string;
    placeName: {
        default: string;
        fr?: string;
    };
    score: number;
    sog: number;
    logo: string;
};

type PeriodDescriptor = {
    number: number;
    periodType: string;
};

type GoalScorer = {
    situationCode: string;
    strength: string;
    playerId: number;
    firstName: {
        default: string;
    };
    lastName: {
        default: string;
    };
    name: {
        default: string;
    };
    teamAbbrev: {
        default: string;
    };
    headshot: string;
    goalsToDate: number;
    awayScore: number;
    homeScore: number;
    timeInPeriod: string;
    shotType: string;
    goalModifier: string;
    assists: {
        playerId: number;
        firstName: {
            default: string;
        };
        lastName: {
            default: string;
        };
        name: {
            default: string;
        };
        assistsToDate: number;
    }[];
};

type PeriodGoal = {
    periodDescriptor: PeriodDescriptor;
    goals: GoalScorer[];
};

type Penalty = {
    timeInPeriod: string;
    type: string;
    duration: number;
    committedByPlayer: string;
    teamAbbrev: string;
    drawnBy: string;
    descKey: string;
};

type TeamGameStats = {
    category: string;
    awayValue: number;
    homeValue: number;
};

type ShotsByPeriod = {
    periodDescriptor: PeriodDescriptor;
    away: number;
    home: number;
};

type Referee = {
    default: string;
};

type Linesman = {
    default: string;
};

type Coach = {
    default: string;
};

type ScratchPlayer = {
    id: number;
    firstName: {
        default: string;
    };
    lastName: {
        default: string;
    };
};

type GameReports = {
    gameSummary: string;
    eventSummary: string;
    playByPlay: string;
    faceoffSummary: string;
    faceoffComparison: string;
    rosters: string;
    shotSummary: string;
    shiftChart: string;
    toiAway: string;
    toiHome: string;
};

type Clock = {
    timeRemaining: string;
    secondsRemaining: number;
    running: boolean;
    inIntermission: boolean;
};

type GameVideo = {
    threeMinRecap: number;
};

export type GameLanding = {
    id: number;
    season: number;
    gameType: number;
    limitedScoring: boolean;
    gameDate: string;
    venue: Venue;
    venueLocation: {
        default: string;
    };
    startTimeUTC: string;
    easternUTCOffset: string;
    venueUTCOffset: string;
    venueTimezone: string;
    periodDescriptor: PeriodDescriptor;
    tvBroadcasts: {
        id: number;
        market: string;
        countryCode: string;
        network: string;
        sequenceNumber: number;
    }[];
    gameState: string;
    gameScheduleState: string;
    awayTeam: TeamInfo;
    homeTeam: TeamInfo;
    shootoutInUse: boolean;
    maxPeriods: number;
    regPeriods: number;
    otInUse: boolean;
    tiesInUse: boolean;
    summary: {
        linescore: {
            byPeriod: {
                periodDescriptor: PeriodDescriptor;
                away: number;
                home: number;
            }[];
            totals: {
                away: number;
                home: number;
            };
        };
        scoring: PeriodGoal[];
    };
    shootout: any[]; // Assuming this is an array of shootout goals or empty
    threeStars: {
        star: number;
        playerId: number;
        teamAbbrev: string;
        headshot: string;
        name: string;
        sweaterNo: number;
        position: string;
        goals?: number;
        assists?: number;
        points?: number;
        goalsAgainstAverage?: number;
        savePctg?: number;
    }[];
    teamGameStats: TeamGameStats[];
    shotsByPeriod: ShotsByPeriod[];
    penalties: Penalty[];
    seasonSeries: {
        id: number;
        season: number;
        gameType: number;
        gameDate: string;
        startTimeUTC: string;
        easternUTCOffset: string;
        venueUTCOffset: string;
        gameState: string;
        gameScheduleState: string;
        awayTeam: {
            id: number;
            abbrev: string;
            logo: string;
            score: number;
        };
        homeTeam: {
            id: number;
            abbrev: string;
            logo: string;
            score: number;
        };
        clock: Clock;
        gameCenterLink: string;
        periodDescriptor: PeriodDescriptor;
        gameOutcome: {
            lastPeriodType: string;
            otPeriods?: number;
        };
    }[];
    gameInfo: {
        referees: Referee[];
        linesmen: Linesman[];
        awayTeam: {
            headCoach: Coach;
            scratches: ScratchPlayer[];
        };
        homeTeam: {
            headCoach: Coach;
            scratches: ScratchPlayer[];
        };
    };
    gameReports: GameReports;
    seasonSeriesWins: {
        awayTeamWins: number;
        homeTeamWins: number;
    };
    clock: Clock;
    gameVideo: GameVideo;
};




//https://api-web.nhle.com/v1/gamecenter/2023020708/boxscore
export type Boxscore = {
    id: number;
    season: number;
    gameType: number;
    limitedScoring: boolean;
    gameDate: string;
    venue: {
        default: string;
    };
    venueLocation: {
        default: string;
    };
    startTimeUTC: string;
    easternUTCOffset: string;
    venueUTCOffset: string;
    tvBroadcasts: {
        id: number;
        market: string;
        countryCode: string;
        network: string;
        sequenceNumber: number;
    }[];
    gameState: string;
    gameScheduleState: string;
    periodDescriptor: {
        number: number;
        periodType: string;
    };
    regPeriods: number;
    awayTeam: {
        id: number;
        name: {
            default: string;
        };
        abbrev: string;
        score: number;
        sog: number;
        logo: string;
        placeName: {
            default: string;
        };
    };
    homeTeam: {
        id: number;
        name: {
            default: string;
        };
        abbrev: string;
        score: number;
        sog: number;
        logo: string;
        placeName: {
            default: string;
        };
    };
    clock: {
        timeRemaining: string;
        secondsRemaining: number;
        running: boolean;
        inIntermission: boolean;
    };
    playerByGameStats: {
        awayTeam: {
            forwards: {
                playerId: number;
                sweaterNumber: number;
                name: {
                    default: string;
                };
                position: string;
                goals: number;
                assists: number;
                points: number;
                plusMinus: number;
                pim: number;
                hits: number;
                powerPlayGoals: number;
                shots: number;
                faceoffWinningPctg: number;
                toi: string;
            }[];
            defense: {
                playerId: number;
                sweaterNumber: number;
                name: {
                    default: string;
                };
                position: string;
                goals: number;
                assists: number;
                points: number;
                plusMinus: number;
                pim: number;
                hits: number;
                powerPlayGoals: number;
                shots: number;
                faceoffWinningPctg: number;
                toi: string;
            }[];
            goalies: {
                playerId: number;
                sweaterNumber: number;
                name: {
                    default: string;
                };
                position: string;
                evenStrengthShotsAgainst: string;
                powerPlayShotsAgainst: string;
                shorthandedShotsAgainst: string;
                saveShotsAgainst: string;
                evenStrengthGoalsAgainst: number;
                powerPlayGoalsAgainst: number;
                shorthandedGoalsAgainst: number;
                pim: number;
                goalsAgainst: number;
                toi: string;
                savePctg?: string;
            }[];
        };
        homeTeam: {
            forwards: {
                playerId: number;
                sweaterNumber: number;
                name: {
                    default: string;
                };
                position: string;
                goals: number;
                assists: number;
                points: number;
                plusMinus: number;
                pim: number;
                hits: number;
                powerPlayGoals: number;
                shots: number;
                faceoffWinningPctg: number;
                toi: string;
            }[];
            defense: {
                playerId: number;
                sweaterNumber: number;
                name: {
                    default: string;
                };
                position: string;
                goals: number;
                assists: number;
                points: number;
                plusMinus: number;
                pim: number;
                hits: number;
                powerPlayGoals: number;
                shots: number;
                faceoffWinningPctg: number;
                toi: string;
            }[];
            goalies: {
                playerId: number;
                sweaterNumber: number;
                name: {
                    default: string;
                };
                position: string;
                evenStrengthShotsAgainst: string;
                powerPlayShotsAgainst: string;
                shorthandedShotsAgainst: string;
                saveShotsAgainst: string;
                evenStrengthGoalsAgainst: number;
                powerPlayGoalsAgainst: number;
                shorthandedGoalsAgainst: number;
                pim: number;
                goalsAgainst: number;
                toi: string;
                savePctg?: string;
            }[];
        };
    };
    summary: {
        linescore: {
            byPeriod: {
                periodDescriptor: {
                    number: number;
                    periodType: string;
                };
                away: number;
                home: number;
            }[];
            totals: {
                away: number;
                home: number;
            };
        };
        shotsByPeriod: {
            periodDescriptor: {
                number: number;
                periodType: string;
            };
            away: number;
            home: number;
        }[];
        teamGameStats: {
            category: string;
            awayValue: any;
            homeValue: any;
        }[];
        seasonSeries: {
            id: number;
            season: number;
            gameType: number;
            gameDate: string;
            startTimeUTC: string;
            easternUTCOffset: string;
            venueUTCOffset: string;
            gameState: string;
            gameScheduleState: string;
            awayTeam: {
                id: number;
                abbrev: string;
                logo: string;
                score: number;
            };
            homeTeam: {
                id: number;
                abbrev: string;
                logo: string;
                score: number;
            };
            clock: {
                timeRemaining: string;
                secondsRemaining: number;
                running: boolean;
                inIntermission: boolean;
            };
            gameCenterLink: string;
            periodDescriptor: {
                number: number;
                periodType: string;
            };
            gameOutcome: {
                lastPeriodType: string;
            };
            otPeriods?: number;
        }[];
        seasonSeriesWins: {
            awayTeamWins: number;
            homeTeamWins: number;
        };
        gameReports: {
            gameSummary: string;
            eventSummary: string;
            playByPlay: string;
            faceoffSummary: string;
            faceoffComparison: string;
            rosters: string;
            shotSummary: string;
            shiftChart: string;
            toiAway: string;
            toiHome: string;
        };
        gameInfo: {
            referees: {
                default: string;
            }[];
            linesmen: {
                default: string;
            }[];
            awayTeam: {
                headCoach: {
                    default: string;
                };
                scratches: {
                    id: number;
                    firstName: {
                        default: string;
                    };
                    lastName: {
                        default: string;
                    };
                }[];
            };
            homeTeam: {
                headCoach: {
                    default: string;
                };
                scratches: {
                    id: number;
                    firstName: {
                        default: string;
                    };
                    lastName: {
                        default: string;
                    };
                }[];
            };
        };
    };
    gameOutcome: {
        lastPeriodType: string;
    };
    gameVideo: {
        threeMinRecap: number;
    };
};

//https://api-web.nhle.com/v1/score/2024-01-20

type TVBroadcast = {
    id: number;
    market: string;
    countryCode: string;
    network: string;
    sequenceNumber: number;
}

export type Team = {
    id: number;
    name: { default: string };
    abbrev: string;
    score: number;
    sog: number;
    logo: string;
}

type Player = {
    playerId: number;
    name: { default: string };
}

type Assist = Player & {
    assistsToDate: number;
}

type Goal = {
    period: number;
    periodDescriptor: {
        number: number;
        periodType: string;
    };
    timeInPeriod: string;
    playerId: number;
    name: { default: string };
    mugshot: string;
    teamAbbrev: string;
    goalsToDate: number;
    awayScore: number;
    homeScore: number;
    strength: string;
    highlightClip: number;
    assists?: Assist[];
}

export type Game = {
    id: number;
    season: number;
    gameType: number;
    gameDate: string;
    venue: Venue;
    startTimeUTC: string;
    easternUTCOffset: string;
    venueUTCOffset: string;
    tvBroadcasts: TVBroadcast[];
    gameState: string;
    gameScheduleState: string;
    awayTeam: Team;
    homeTeam: Team;
    gameCenterLink: string;
    threeMinRecap: string;
    clock: Clock;
    neutralSite: boolean;
    venueTimezone: string;
    period: number;
    periodDescriptor: PeriodDescriptor;
    gameOutcome: GameOutcome;
    goals: Goal[];
}

type OddsPartner = {
    partnerId: number;
    country?: string;
    name: string;
    imageUrl?: string;
    siteUrl?: string;
    bgColor?: string;
    textColor?: string;
    accentColor?: string;
}

type GameWeek = {
    date: string;
    dayAbbrev: string;
    numberOfGames: number;
}

export type NHLScores = {
    prevDate: string;
    currentDate: string;
    nextDate: string;
    gameWeek: GameWeek[];
    oddsPartners: OddsPartner[];
    games: Game[];
}

//https://api-web.nhle.com/v1/gamecenter/2023020708/play-by-play
type PlayByPlayAssists = {
    playerId: number;
    name: { default: string };
    assistsToDate: number;
}

type PlayByPlayPlayer = {
    period: number;
    periodDescriptor: PeriodDescriptor;
    timeInPeriod: string;
    playerId: number;
    name: { default: string };
    firstName: { default: string };
    lastName: { default: string };
    goalModifier: string;
    assists: PlayByPlayAssists[];
    mugshot: string;
    teamAbbrev: string;
    goalsToDate: number;
    awayScore: number;
    homeScore: number;
    strength: string;
    highlightClip: number;
    highlightClipFr: number;
}

type PlayByPlayGoal = {
    period: number;
    periodDescriptor: PeriodDescriptor;
    timeInPeriod: string;
    playerId: number;
    name: { default: string };
    firstName: { default: string };
    lastName: { default: string };
    goalModifier: string;
    assists: PlayByPlayAssists[];
    mugshot: string;
    teamAbbrev: string;
    goalsToDate: number;
    awayScore: number;
    homeScore: number;
    strength: string;
    highlightClip: number;
    highlightClipFr: number;
}
type Details = {
    eventOwnerTeamId: number;
    losingPlayerId?: number;
    winningPlayerId?: number;
    xCoord?: number;
    yCoord?: number;
    zoneCode?: string;
    reason?: string;
    shotType?: string;
    shootingPlayerId?: number;
    goalieInNetId?: number;
    awaySOG?: number;
    homeSOG?: number;
    typeCode?: string;
    descKey?: string;
    duration?: number;
    servedByPlayerId?: number;
    committedByPlayerId?: number;
    drawnByPlayerId?: number;
    blockingPlayerId?: number;
    hitteePlayerId?: number;
    hittingPlayerId?: number;
    scoringPlayerId?: number;
    scoringPlayerTotal?: number;
    assist1PlayerId?: number;
    assist1PlayerTotal?: number;
    assist2PlayerId?: number;
    assist2PlayerTotal?: number;
    awayScore?: number;
    homeScore?: number;
}
type Play = {
    eventId: number;
    periodDescriptor: PeriodDescriptor;
    timeInPeriod: string;
    timeRemaining: string;
    situationCode: string;
    homeTeamDefendingSide: string;
    typeCode: number;
    typeDescKey: 'period-start' | 'faceoff' | 'stoppage' | 'shot-on-goal' | 'penalty' | 'hit' | 'missed-shot'
    | 'blocked-shot' | 'takeaway' | 'giveaway' | 'offside' | 'icing' | 'challenge' | 'fight' | 'period-end'
    | 'game-end' | 'delayed-penalty' | 'goal';
    sortOrder: number;
    details?: Details;
}

type GameOutcome = {
    lastPeriodType: string;
}
export type PlayByPlayGame = {
    id: number;
    season: number;
    gameType: number;
    limitedScoring: boolean;
    gameDate: string;
    venue: Venue;
    venueLocation: { default: string };
    startTimeUTC: string;
    easternUTCOffset: string;
    venueUTCOffset: string;
    tvBroadcasts: TVBroadcast[];
    gameState: string;
    gameScheduleState: string;
    periodDescriptor: PeriodDescriptor;
    awayTeam: Team;
    homeTeam: Team;
    shootoutInUse: boolean;
    otInUse: boolean;
    clock: Clock;
    displayPeriod: number;
    maxPeriods: number;
    gameOutcome: GameOutcome;
    plays: Play[];
    players: PlayByPlayPlayer[];
    goals: PlayByPlayGoal[];
}

export type ISODateString = string;

export function isISODateString(date: string): date is ISODateString {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
}