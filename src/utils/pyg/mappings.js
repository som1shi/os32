export const PYTHON_TO_PYG = {
  'def': 'bop',
  'return': 'its giving',
  'if': 'chat is this real',
  'elif': 'yo chat',
  'else': 'only in ohio',
  'while': 'let him cook',
  '+': 'rizz',
  '-': 'fanum tax',
  'print': 'yap',
  'True': 'Aura',
  'False': 'Cooked',
  'import': 'glaze',
  '==': 'twin',
  '>': 'sigma',
  '<': 'beta',
  'for': 'mewing',
  'in': 'diddy',
  'range': 'huzz',
  'try': 'hawk',
  'except': 'tuah',
  'finally': 'spit on that thang',
  'class': 'skibidi',
  'break': 'just put the fries in the bag bro',
  'continue': 'edge',
  'assert': 'sus',
  'raise': 'crashout',
  'with': 'pookie',
  'as': 'ahh',
  'global': 'GOAT',
  'nonlocal': 'motion',
  'del': 'delulu',
  'yield': 'pause',
  'yield from': 'pause no diddy',
  'None': 'NPC',
  'pass': 'pluh',
  'self': 'unc',
  '>=': 'sigma twin',
  '<=': 'beta twin',
  'from': 'lock in',
  'open': 'mog',
  'close': 'demure'
};


export const PYG_TO_PYTHON = Object.entries(PYTHON_TO_PYG).reduce(
  (acc, [key, value]) => ({
    ...acc,
    [value]: key
  }),
  {}
);


export const PYTHON_KEYWORDS = [
  'def', 'return', 'if', 'elif', 'else', 'while', 'for', 'in', 'range',
  'import', 'from', 'as', 'True', 'False', 'None', 'and', 'or', 'not',
  'class', 'try', 'except', 'finally', 'with', 'global', 'lambda',
  'break', 'continue', 'assert', 'raise', 'nonlocal', 'del', 'yield',
  'yield from', 'pass', 'self', 'open', 'close'
];


export const PYG_KEYWORDS = Object.values(PYTHON_TO_PYG).concat([
  'and', 'or', 'not', 'lambda'
]); 