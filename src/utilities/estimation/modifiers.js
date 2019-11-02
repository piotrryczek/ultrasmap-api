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

/*
-3 - -1
-2 - -0,8
-1 - -0,5
0 - 0
1 - 0,25
2 - 0,45
3 - 0,55
4 - 0,6
*/
export const getTierDiffModiifer = (tier) => {
  // eslint-disable-next-line no-mixed-operators
  const tierDiffModifier = -0.04991883 + 0.3717758 * tier - 0.04398674 * tier ** 2 - 0.01284722 * tier ** 3 + 0.002698864 * tier ** 4;

  return tierDiffModifier;
}

export const getRelationTypeModifier = (relationType) => {
  switch (relationType) {
    case 'enemy': return 1.3;
    case 'friendship': return 1;
    case 'agreement': return 0.8;
    case 'positive': return 0.5;
    default: throw new Error('Incorrect relation');
  }
};

export const getImportanceModifierBasedOnAttitude = (attitude) => {
  if (attitude === 50) return 1;

  const finalModifier = attitude > 50 ? 0.2 : 0.4; // For negative importance is higher

  return 1 + (((1 - attitude / 50) ** 2) * finalModifier); // further from neutral the more important is match
};

/*
max: 1,4
min: 1

0 - 1.45
10 - 1,4
20 - 1,3
50 - 1,2
100 - 1,1
200 - 1
*/
export const getDistanceModifier = (distance) => {
  const maxModifier = 1.4;
  const minModifier = 1;

  const modifier = 0.9327006 + (1.453068 - 0.9327006) / (1 + ((distance / 49.86131) ** 1.169678)); // mycurvefit.com

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
