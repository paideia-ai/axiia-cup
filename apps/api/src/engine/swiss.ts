function pairingKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function swissPair(params: {
  playerIds: number[];
  previousPairings: Set<string>;
  standings: Map<number, number>;
}): Array<[number, number]> {
  const sortedPlayers = [...params.playerIds].sort((left, right) => {
    const winDiff = (params.standings.get(right) ?? 0) - (params.standings.get(left) ?? 0);

    if (winDiff !== 0) {
      return winDiff;
    }

    return left - right;
  });

  const remaining = [...sortedPlayers];
  const pairs: Array<[number, number]> = [];

  while (remaining.length > 1) {
    const player = remaining.shift();

    if (player === undefined) {
      break;
    }

    let opponentIndex = remaining.findIndex(
      (candidate) => !params.previousPairings.has(pairingKey(player, candidate)),
    );

    if (opponentIndex === -1) {
      opponentIndex = 0;
    }

    const [opponent] = remaining.splice(opponentIndex, 1);

    if (opponent !== undefined) {
      pairs.push([player, opponent]);
    }
  }

  return pairs;
}
