const getTierModifier = (tier) => {
  const tierModifier = 2.374636 + (0.04310641 - 2.374636) / (1 + ((tier / 5.142781) ** 2.654106));

  return {
    [tier]: tierModifier,
  };
};

const getImportanceDiffModifier = diff => 0.3913562 + (1.191325 - 0.3913562) / (1 + ((diff / 2.791183) ** 2.23108)); // mycurvefit.com

const getBaseStrength = (nrValues, level) => {
  switch (level) {
    case 2: return 9;
    case 3: return 16;
    case 4: return 25;
    default: return 1;
  }
};

const weightedArithmeticMean = (values = [], level = 4) => {
  const baseStrength = getBaseStrength(values.length, level);

  const accValue = values.reduce((acc, value) => acc + value, 0);

  const attitude = (50 * baseStrength + accValue) / (baseStrength + values.length);

  return attitude;
};

const results = [
  weightedArithmeticMean([30]),
  weightedArithmeticMean([30, 30]),
  weightedArithmeticMean([30, 30, 30]),
  weightedArithmeticMean([30, 30, 30, 30]),
  weightedArithmeticMean([30, 30, 30, 30, 30]),
  weightedArithmeticMean([30, 30, 30, 30, 30, 30]),
  weightedArithmeticMean([30, 30, 30, 30, 30, 30, 30]),
  weightedArithmeticMean([30, 30, 30, 30, 30, 30, 30, 30]),
  weightedArithmeticMean([30, 30, 30, 30, 30, 30, 30, 30, 30]),
  weightedArithmeticMean([30, 30, 30, 30, 30, 30, 30, 30, 30, 30]),
];

// console.log(results);

// results.reduce((acc, current) => {
//   console.log(acc - current);

//   return current;
// }, 50);

const tierModifiers = [
  getTierModifier(0),
  getTierModifier(0.5),
  getTierModifier(1),
  getTierModifier(1.5),
  getTierModifier(2),
  getTierModifier(2.5),
  getTierModifier(3),
  getTierModifier(3.5),
  getTierModifier(4),
  getTierModifier(4.5),
  getTierModifier(5),
  getTierModifier(5.5),
  getTierModifier(6),
  getTierModifier(6.5),
  getTierModifier(7),
  getTierModifier(7.5),
  getTierModifier(8),
  getTierModifier(8.5),
  getTierModifier(9),
  getTierModifier(9.5),
  getTierModifier(10),
  getTierModifier(10.5),
  getTierModifier(11),
];

console.log(tierModifiers);

// const tierImportanceModiifer = [
//   getImportanceDiffModifier(0),
//   getImportanceDiffModifier(1),
//   getImportanceDiffModifier(2),
//   getImportanceDiffModifier(3),
//   getImportanceDiffModifier(4),
//   getImportanceDiffModifier(5),
//   getImportanceDiffModifier(6),
//   getImportanceDiffModifier(7),
//   getImportanceDiffModifier(8),
// ];

// console.log(tierImportanceModiifer);