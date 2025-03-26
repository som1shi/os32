/**
 * Python to PYG keyword and operator mappings
 */
export const PYTHON_TO_PYG = {
  
  'def': 'bop',
  'return': 'its giving',
  'if': 'chat is this real',
  'elif': 'yo chat',
  'else': 'only in ohio',
  'while': 'let him cook',
  'for': 'mewing',
  'in': 'diddy',
  'range': 'huzz',
  'True': 'Aura',
  'False': 'Cooked',
  'None': 'NPC',
  'import': 'glaze',
  'from': 'lock in',
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
  'pass': 'pluh',
  'self': 'unc',
  'open': 'mog',
  'close': 'demure',
  'print': 'yap',
  
  
  '+': 'rizz',
  '-': 'fanum tax',
  '==': 'twin',
  '>': 'sigma',
  '<': 'beta',
  '>=': 'sigma twin',
  '<=': 'beta twin'
};

/**
 * PYG to Python keyword and operator mappings (generated from PYTHON_TO_PYG)
 */
export const PYG_TO_PYTHON = Object.freeze(
  Object.entries(PYTHON_TO_PYG).reduce(
    (acc, [key, value]) => {
      acc[value] = key;
      return acc;
    },
    {}
  )
);

/**
 * Complete list of Python keywords for syntax highlighting
 */
export const PYTHON_KEYWORDS = Object.freeze([
  'def', 'class', 'from', 'import', 'return', 'if', 'else', 'elif', 'for', 'while',
  'break', 'continue', 'try', 'except', 'finally', 'raise', 'with', 'as', 'in',
  'is', 'not', 'and', 'or', 'True', 'False', 'None', 'lambda', 'global', 'nonlocal',
  'del', 'pass', 'yield', 'assert', 'self', 'range', 'open', 'close'
]);

/**
 * Complete list of PYG keywords for syntax highlighting
 */
export const PYG_KEYWORDS = Object.freeze([
  
  ...Object.values(PYTHON_TO_PYG),
  
  'and', 'or', 'not', 'lambda',
  
  'bop', 'skibidi', 'lock in', 'glaze', 'its giving', 'chat is this real', 'only in ohio', 
  'yo chat', 'mewing', 'let him cook', 'just put the fries in the bag bro', 'edge', 
  'hawk', 'tuah', 'spit on that thang', 'crashout', 'pookie', 'ahh', 'diddy',
  'Aura', 'Cooked', 'NPC', 'GOAT', 'motion', 'delulu', 'pluh', 'pause', 'sus', 
  'rizz', 'fanum tax', 'sigma', 'beta', 'twin', 'sigma twin', 'beta twin', 'unc', 
  'huzz', 'mog', 'demure', 'yap'
]); 