/**
 * Returns the NHL team abbreviation for a given team name.
 * @param teamName - The name of the NHL team.
 * @returns The NHL team abbreviation.
 */
export function nstAbbreviation(teamName: string): string {
  teamName = teamName.replace("é", "e");
  const nssTeams: { [key: string]: string } = {
    "Anaheim Ducks": "ANA",
    "Arizona Coyotes": "ARI",
    "Boston Bruins": "BOS",
    "Buffalo Sabres": "BUF",
    "Carolina Hurricanes": "CAR",
    "Columbus Blue Jackets": "CBJ",
    "Calgary Flames": "CGY",
    "Chicago Blackhawks": "CHI",
    "Colorado Avalanche": "COL",
    "Dallas Stars": "DAL",
    "Detroit Red Wings": "DET",
    "Edmonton Oilers": "EDM",
    "Florida Panthers": "FLA",
    "Los Angeles Kings": "L.A",
    "Minnesota Wild": "MIN",
    "Montreal Canadiens": "MTL",
    "New Jersey Devils": "N.J",
    "Nashville Predators": "NSH",
    "New York Islanders": "NYI",
    "New York Rangers": "NYR",
    "Ottawa Senators": "OTT",
    "Philadelphia Flyers": "PHI",
    "Pittsburgh Penguins": "PIT",
    "San Jose Sharks": "S.J",
    "Seattle Kraken": "SEA",
    "St. Louis Blues": "STL",
    "Tampa Bay Lightning": "T.B",
    "Toronto Maple Leafs": "TOR",
    "Vancouver Canucks": "VAN",
    "Vegas Golden Knights": "VGK",
    "Winnipeg Jets": "WPG",
    "Washington Capitals": "WSH",
  };
  return nssTeams[teamName];
}
