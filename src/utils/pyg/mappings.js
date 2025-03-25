
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
  'range': 'huzz'
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
  'class', 'try', 'except', 'finally', 'with', 'global', 'lambda'
];


export const PYG_KEYWORDS = Object.values(PYTHON_TO_PYG).concat([
  'from', 'as', 'None', 'and', 'or', 'not', 'class', 'try', 'except', 
  'finally', 'with', 'global', 'lambda'
]); 