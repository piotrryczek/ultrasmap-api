/*
0 - 0
1 - 0.1
2 - 0.25
3 - 0.5
4 - 0.8
5 - 1.15
6 - 1.45
7 - 1.7
8 - 1.85
9 - 1.9
*/
export const getTierModifier = (tier) => {
  const tierModifier = 2.374636 + (0.04310641 - 2.374636) / (1 + ((tier / 5.142781) ** 2.654106)); // mycurvefit.com

  return tierModifier;
};

export const getRelationTypeModifier = (relationType) => {
  switch (relationType) {
    case 'enemy': return 1.3;
    case 'friendship': return 0.9;
    case 'agreement': return 0.7;
    case 'positive': return 0.5;
    default: throw new Error('Incorrect relation');
  }
};

export const getImportanceModifierBasedOnAttitude = (attitude) => {
  if (attitude === 50) return 1;

  const finalModifier = attitude > 50 ? 0.15 : 0.3; // For negative importance is higher

  return 1 + (((1 - attitude / 50) ** 2) * finalModifier); // further from neutral the more important is match
};

export const getDistanceModifier = (distance) => {
  const maxModifier = 1.2;
  const minModifier = 1;

  if (distance === 0) return maxModifier;

  const modifier = 1 + (1 - (Math.log(distance ** 1.7) / 10));

  if (modifier > maxModifier) return maxModifier;
  if (modifier < minModifier) return minModifier;

  return modifier;
};

/*
0 - 1.2
1 - 1.1
2 - 0.95
3 - 0.75
4 - 0.65
5 - 0.55
6 - 0.5
*/
export const getImportanceDiffModifier = diff => 0.3913562 + (1.191325 - 0.3913562) / (1 + ((diff / 2.791183) ** 2.23108)); // mycurvefit.com

