import { PYTHON_TO_PYG, PYG_TO_PYTHON, PYTHON_KEYWORDS, PYG_KEYWORDS } from './mappings';

/**
 * Optimized tokenizer for Python/PYG code
 * @param {string} code - Code to tokenize
 * @returns {Array} Array of tokens
 */
const tokenize = (code) => {
  code = code.replace(/(\r\n|\n|\r)/g, '\n');
  
  const tokens = [];
  let i = 0;
  
  const checkMultiWordKeyword = (startIndex) => {
    const remainingCode = code.slice(startIndex);
    
    for (const pygKeyword of PYG_KEYWORDS) {
      if (pygKeyword.includes(' ') && 
          remainingCode.startsWith(pygKeyword) && 
          (startIndex + pygKeyword.length === code.length || 
           /\s|[+\-*/%=<>!&|^~:;,.()[\]{}]/.test(code[startIndex + pygKeyword.length]))) {
        
        return {
          type: 'word',
          value: pygKeyword,
          length: pygKeyword.length
        };
      }
    }
    
    return null;
  };
  
  
  while (i < code.length) {
    
    const multiWordToken = checkMultiWordKeyword(i);
    if (multiWordToken) {
      tokens.push(multiWordToken);
      i += multiWordToken.length;
      continue;
    }
    
    const char = code[i];
    
    
    if (/\s/.test(char)) {
      let whitespace = '';
      
      while (i < code.length && /\s/.test(code[i])) {
        if (code[i] === '\n') {
          if (whitespace) {
            tokens.push({ type: 'whitespace', value: whitespace });
            whitespace = '';
          }
          tokens.push({ type: 'newline', value: '\n' });
        } else {
          whitespace += code[i];
        }
        i++;
      }
      
      if (whitespace) {
        tokens.push({ type: 'whitespace', value: whitespace });
      }
      
      continue;
    }
    
    
    if (char === '"' || char === "'") {
      const quote = char;
      let string = quote;
      i++;
      
      while (i < code.length && code[i] !== quote) {
        
        if (code[i] === '\\' && i + 1 < code.length) {
          string += code[i] + code[i + 1];
          i += 2;
        } else {
          string += code[i];
          i++;
        }
      }
      
      if (i < code.length) {
        string += code[i];
        i++;
      }
      
      tokens.push({ type: 'string', value: string });
      continue;
    }
    
    
    if (char === '#') {
      let comment = '';
      
      while (i < code.length && code[i] !== '\n') {
        comment += code[i];
        i++;
      }
      
      tokens.push({ type: 'comment', value: comment });
      continue;
    }
    
    
    if (/[=<>!]/.test(char) && i + 1 < code.length && code[i + 1] === '=') {
      tokens.push({ type: 'operator', value: char + '=' });
      i += 2;
      continue;
    }
    
    
    if (/[+\-*/%=<>!&|^~:;,.()[\]{}]/.test(char)) {
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }
    
    
    if (/[a-zA-Z0-9_]/.test(char)) {
      let word = '';
      
      while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
        word += code[i];
        i++;
      }
      
      tokens.push({ type: 'word', value: word });
      continue;
    }
    
    
    tokens.push({ type: 'other', value: char });
    i++;
  }
  
  return tokens;
};

/**
 * Converts Python code to PYG
 * @param {string} pythonCode - Python code to convert
 * @returns {string} Equivalent PYG code
 * @throws {Error} If conversion fails
 */
export const pythonToPYG = (pythonCode) => {
  if (!pythonCode || typeof pythonCode !== 'string') {
    throw new Error('Input must be a non-empty string');
  }
  
  try {
    const tokens = tokenize(pythonCode);
    
    return tokens.map(token => {
      if ((token.type === 'word' || token.type === 'operator') && 
          PYTHON_TO_PYG[token.value]) {
        return PYTHON_TO_PYG[token.value];
      }
      return token.value;
    }).join('');
  } catch (error) {
    throw new Error(`Failed to convert Python to PYG: ${error.message}`);
  }
};

/**
 * Converts PYG code to Python
 * @param {string} pygCode - PYG code to convert
 * @returns {string} Equivalent Python code
 * @throws {Error} If conversion fails
 */
export const PYGToPython = (pygCode) => {
  if (!pygCode || typeof pygCode !== 'string') {
    throw new Error('Input must be a non-empty string');
  }
  
  try {
    const tokens = tokenize(pygCode);
    let result = '';
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (token.type === 'word') {
        let matched = false;
        
        
        for (const pygKeyword of Object.values(PYTHON_TO_PYG)) {
          if (pygKeyword.includes(' ')) {
            const words = pygKeyword.split(' ');
            
            if (token.value === words[0] && i + words.length - 1 < tokens.length) {
              
              let isMatch = true;
              for (let j = 1; j < words.length; j++) {
                const nextToken = tokens[i + j];
                if (nextToken.type !== 'word' || nextToken.value !== words[j]) {
                  isMatch = false;
                  break;
                }
              }
              
              if (isMatch) {
                result += PYG_TO_PYTHON[pygKeyword] || pygKeyword;
                i += words.length - 1; 
                matched = true;
                break;
              }
            }
          }
        }
        
        if (!matched) {
          result += PYG_TO_PYTHON[token.value] || token.value;
        }
      } else if (token.type === 'operator') {
        result += PYG_TO_PYTHON[token.value] || token.value;
      } else {
        result += token.value;
      }
    }
    
    return result;
  } catch (error) {
    throw new Error(`Failed to convert PYG to Python: ${error.message}`);
  }
};

/**
 * Apply syntax highlighting to Python code
 * @param {string} code - Python code to highlight
 * @returns {string} HTML with syntax highlighting
 */
export const highlightPython = (code) => {
  code = code.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;');
             
  const tokens = tokenize(code);
  let highlighted = '';
  
  for (const token of tokens) {
    switch (token.type) {
      case 'word':
        if (PYTHON_KEYWORDS.includes(token.value)) {
          highlighted += `<span class="python-keyword">${token.value}</span>`;
        } else if (/^[A-Z][A-Za-z0-9_]*$/.test(token.value)) {
          highlighted += `<span class="python-class">${token.value}</span>`;
        } else if (/^\d+$/.test(token.value)) {
          highlighted += `<span class="python-number">${token.value}</span>`;
        } else {
          highlighted += token.value;
        }
        break;
      case 'string':
        highlighted += `<span class="python-string">${token.value}</span>`;
        break;
      case 'comment':
        highlighted += `<span class="python-comment">${token.value}</span>`;
        break;
      case 'operator':
        highlighted += `<span class="python-operator">${token.value}</span>`;
        break;
      case 'newline':
        highlighted += '<br>';
        break;
      default:
        highlighted += token.value;
    }
  }
  
  return highlighted;
};

/**
 * Apply syntax highlighting to PYG code
 * @param {string} code - PYG code to highlight
 * @returns {string} HTML with syntax highlighting
 */
export const highlightPYG = (code) => {
  code = code.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;');
             
  const tokens = tokenize(code);
  let highlighted = '';
  
  for (const token of tokens) {
    switch (token.type) {
      case 'word':
        if (PYG_KEYWORDS.includes(token.value)) {
          highlighted += `<span class="pyg-keyword">${token.value}</span>`;
        } else if (/^[A-Z][A-Za-z0-9_]*$/.test(token.value)) {
          highlighted += `<span class="pyg-class">${token.value}</span>`;
        } else if (/^\d+$/.test(token.value)) {
          highlighted += `<span class="pyg-number">${token.value}</span>`;
        } else {
          highlighted += token.value;
        }
        break;
      case 'string':
        highlighted += `<span class="pyg-string">${token.value}</span>`;
        break;
      case 'comment':
        highlighted += `<span class="pyg-comment">${token.value}</span>`;
        break;
      case 'operator':
        highlighted += `<span class="pyg-operator">${token.value}</span>`;
        break;
      case 'newline':
        highlighted += '<br>';
        break;
      default:
        highlighted += token.value;
    }
  }
  
  return highlighted;
};


export { PYTHON_KEYWORDS, PYG_KEYWORDS }; 