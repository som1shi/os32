import { PYGToPython } from '../pyg/translator';
import { REGISTERS, DIRECTIVES } from './instructions';

/**
 * RISC-V Compiler
 * Compiles Python/PyG code to RISC-V assembly
 */


const NodeType = {
  PROGRAM: 'Program',
  ASSIGNMENT: 'Assignment',
  BINARY_OP: 'BinaryOp',
  UNARY_OP: 'UnaryOp',
  VARIABLE: 'Variable',
  LITERAL: 'Literal',
  IF_STATEMENT: 'IfStatement',
  WHILE_LOOP: 'WhileLoop',
  FOR_LOOP: 'ForLoop',
  FUNCTION_DEF: 'FunctionDef',
  FUNCTION_CALL: 'FunctionCall',
  RETURN: 'Return',
  BLOCK: 'Block',
  COMPARISON: 'Comparison',
  LIST: 'List',
  DICT: 'Dict',
  PRINT: 'Print'
};


class RegisterAllocator {
  constructor() {
    
    this.tempRegs = ['t0', 't1', 't2', 't3', 't4', 't5', 't6'];
    this.savedRegs = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11'];
    this.argRegs = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'];
    
    this.freeTemps = [...this.tempRegs];
    this.usedTemps = [];
  }
  
  allocTemp() {
    if (this.freeTemps.length === 0) {
      throw new Error('Out of temporary registers!');
    }
    const reg = this.freeTemps.pop();
    this.usedTemps.push(reg);
    return reg;
  }
  
  freeTemp(reg) {
    const index = this.usedTemps.indexOf(reg);
    if (index !== -1) {
      this.usedTemps.splice(index, 1);
      this.freeTemps.push(reg);
    }
  }
  
  getArgReg(index) {
    if (index < 0 || index >= this.argRegs.length) {
      throw new Error(`Argument register index out of range: ${index}`);
    }
    return this.argRegs[index];
  }
}


export const parsePython = (pythonCode) => {
  
  
  
  
  
  const ast = {
    type: NodeType.PROGRAM,
    body: []
  };
  
  
  const lines = pythonCode.split('\n');
  
  let lineIndex = 0;
  while (lineIndex < lines.length) {
    const line = lines[lineIndex].trim();
    
    
    if (!line || line.startsWith('#')) {
      lineIndex++;
      continue;
    }
    
    
    if (line.startsWith('print(') && line.endsWith(')')) {
      const content = line.substring(6, line.length - 1);
      
      
      if ((content.startsWith('"') && content.endsWith('"')) ||
          (content.startsWith("'") && content.endsWith("'"))) {
        
        ast.body.push({
          type: NodeType.PRINT,
          value: {
            type: NodeType.LITERAL,
            value: content.substring(1, content.length - 1),
            dataType: 'string'
          }
        });
      } else if (!isNaN(Number(content))) {
        
        ast.body.push({
          type: NodeType.PRINT,
          value: {
            type: NodeType.LITERAL,
            value: Number(content),
            dataType: 'number'
          }
        });
      } else {
        
        ast.body.push({
          type: NodeType.PRINT,
          value: {
            type: NodeType.VARIABLE,
            name: content
          }
        });
      }
    }
    
    
    else if (line.includes('=') && !line.includes('==')) {
      const [left, right] = line.split('=').map(s => s.trim());
      
      
      if (!isNaN(Number(right))) {
        ast.body.push({
          type: NodeType.ASSIGNMENT,
          target: {
            type: NodeType.VARIABLE,
            name: left
          },
          value: {
            type: NodeType.LITERAL,
            value: Number(right),
            dataType: 'number'
          }
        });
      } 
      
      else if ((right.startsWith('"') && right.endsWith('"')) ||
               (right.startsWith("'") && right.endsWith("'"))) {
        ast.body.push({
          type: NodeType.ASSIGNMENT,
          target: {
            type: NodeType.VARIABLE,
            name: left
          },
          value: {
            type: NodeType.LITERAL,
            value: right.substring(1, right.length - 1),
            dataType: 'string'
          }
        });
      }
      
      else if (['+', '-', '*', '/'].some(op => right.includes(op))) {
        
        const opMatch = right.match(/([a-zA-Z0-9_]+)\s*([+\-*/])\s*([a-zA-Z0-9_]+)/);
        if (opMatch) {
          const [_, leftOperand, operator, rightOperand] = opMatch;
          
          ast.body.push({
            type: NodeType.ASSIGNMENT,
            target: {
              type: NodeType.VARIABLE,
              name: left
            },
            value: {
              type: NodeType.BINARY_OP,
              operator,
              left: !isNaN(Number(leftOperand)) 
                ? { type: NodeType.LITERAL, value: Number(leftOperand), dataType: 'number' }
                : { type: NodeType.VARIABLE, name: leftOperand },
              right: !isNaN(Number(rightOperand))
                ? { type: NodeType.LITERAL, value: Number(rightOperand), dataType: 'number' }
                : { type: NodeType.VARIABLE, name: rightOperand }
            }
          });
        }
      }
      
      else {
        ast.body.push({
          type: NodeType.ASSIGNMENT,
          target: {
            type: NodeType.VARIABLE,
            name: left
          },
          value: {
            type: NodeType.VARIABLE,
            name: right
          }
        });
      }
    }
    
    
    else if (line.startsWith('if ') && line.endsWith(':')) {
      const condition = line.substring(3, line.length - 1).trim();
      
      
      const conditionNode = parseCondition(condition);
      
      
      const ifBody = [];
      let ifLineIndex = lineIndex + 1;
      let indentLevel = getIndentLevel(lines[ifLineIndex]);
      
      while (ifLineIndex < lines.length && 
             (indentLevel > getIndentLevel(lines[lineIndex]) || lines[ifLineIndex].trim() === '')) {
        if (lines[ifLineIndex].trim() !== '') {
          ifBody.push(lines[ifLineIndex]);
        }
        ifLineIndex++;
        if (ifLineIndex < lines.length) {
          indentLevel = getIndentLevel(lines[ifLineIndex]);
        }
      }
      
      
      ast.body.push({
        type: NodeType.IF_STATEMENT,
        condition: conditionNode,
        body: {
          type: NodeType.BLOCK,
          body: parsePython(ifBody.join('\n')).body
        },
        alternate: null  
      });
      
      
      lineIndex = ifLineIndex;
      continue;
    }
    
    
    else if (line.startsWith('while ') && line.endsWith(':')) {
      const condition = line.substring(6, line.length - 1).trim();
      
      
      const conditionNode = parseCondition(condition);
      
      
      const whileBody = [];
      let whileLineIndex = lineIndex + 1;
      let indentLevel = getIndentLevel(lines[whileLineIndex]);
      
      while (whileLineIndex < lines.length && 
             (indentLevel > getIndentLevel(lines[lineIndex]) || lines[whileLineIndex].trim() === '')) {
        if (lines[whileLineIndex].trim() !== '') {
          whileBody.push(lines[whileLineIndex]);
        }
        whileLineIndex++;
        if (whileLineIndex < lines.length) {
          indentLevel = getIndentLevel(lines[whileLineIndex]);
        }
      }
      
      
      ast.body.push({
        type: NodeType.WHILE_LOOP,
        condition: conditionNode,
        body: {
          type: NodeType.BLOCK,
          body: parsePython(whileBody.join('\n')).body
        }
      });
      
      
      lineIndex = whileLineIndex;
      continue;
    }
    
    lineIndex++;
  }
  
  return ast;
};


const parseCondition = (condition) => {
  
  const comparisonOps = ['==', '!=', '<', '>', '<=', '>='];
  let operator = null;
  for (const op of comparisonOps) {
    if (condition.includes(op)) {
      operator = op;
      break;
    }
  }
  
  if (operator) {
    const [left, right] = condition.split(operator).map(s => s.trim());
    
    return {
      type: NodeType.COMPARISON,
      operator,
      left: !isNaN(Number(left))
        ? { type: NodeType.LITERAL, value: Number(left), dataType: 'number' }
        : { type: NodeType.VARIABLE, name: left },
      right: !isNaN(Number(right))
        ? { type: NodeType.LITERAL, value: Number(right), dataType: 'number' }
        : { type: NodeType.VARIABLE, name: right }
    };
  }
  
  
  if (!isNaN(Number(condition))) {
    return { 
      type: NodeType.LITERAL, 
      value: Number(condition),
      dataType: 'number'
    };
  } else {
    return {
      type: NodeType.VARIABLE,
      name: condition
    };
  }
};


const getIndentLevel = (line) => {
  if (!line) return 0;
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
};


export const generateAssembly = (ast) => {
  const assemblyCode = [];
  const stringLiterals = [];
  const variableMap = new Map(); 
  let stackSize = 0;
  let stringCounter = 0;
  let labelCounter = 0;
  
  
  assemblyCode.push(DIRECTIVES.DATA);
  
  
  const addStringLiteral = (str) => {
    const label = `str_${stringCounter++}`;
    assemblyCode.push(`${label}: ${DIRECTIVES.STRING} "${str}"`);
    return label;
  };
  
  
  const generateLabel = (prefix) => {
    return `${prefix}_${labelCounter++}`;
  };
  
  
  const allocateVariable = (name) => {
    if (!variableMap.has(name)) {
      stackSize += 4; 
      variableMap.set(name, -stackSize);
    }
    return variableMap.get(name);
  };
  
  
  assemblyCode.push(DIRECTIVES.TEXT);
  
  
  assemblyCode.push(`${DIRECTIVES.GLOBAL} main`);
  assemblyCode.push('main:');
  
  
  assemblyCode.push('  addi sp, sp, -16');  
  assemblyCode.push('  sw ra, 12(sp)');     
  assemblyCode.push('  sw s0, 8(sp)');      
  assemblyCode.push('  addi s0, sp, 16');   
  
  
  const regAllocator = new RegisterAllocator();
  
  
  for (const statement of ast.body) {
    assemblyCode.push(`  # ${statement.type}`);
    
    switch (statement.type) {
      case NodeType.ASSIGNMENT: {
        const { target, value } = statement;
        
        
        const offset = allocateVariable(target.name);
        
        if (value.type === NodeType.LITERAL) {
          
          if (value.dataType === 'number') {
            const tempReg = regAllocator.allocTemp();
            assemblyCode.push(`  li ${tempReg}, ${value.value}`);
            assemblyCode.push(`  sw ${tempReg}, ${offset}(s0)`);
            regAllocator.freeTemp(tempReg);
          } else if (value.dataType === 'string') {
            
            const stringLabel = addStringLiteral(value.value);
            const tempReg = regAllocator.allocTemp();
            assemblyCode.push(`  la ${tempReg}, ${stringLabel}`);
            assemblyCode.push(`  sw ${tempReg}, ${offset}(s0)`);
            regAllocator.freeTemp(tempReg);
          }
        }
        else if (value.type === NodeType.VARIABLE) {
          
          const sourceOffset = allocateVariable(value.name);
          const tempReg = regAllocator.allocTemp();
          assemblyCode.push(`  lw ${tempReg}, ${sourceOffset}(s0)`);
          assemblyCode.push(`  sw ${tempReg}, ${offset}(s0)`);
          regAllocator.freeTemp(tempReg);
        }
        else if (value.type === NodeType.BINARY_OP) {
          
          const leftReg = regAllocator.allocTemp();
          const rightReg = regAllocator.allocTemp();
          const resultReg = regAllocator.allocTemp();
          
          
          if (value.left.type === NodeType.LITERAL) {
            assemblyCode.push(`  li ${leftReg}, ${value.left.value}`);
          } else {
            const leftOffset = allocateVariable(value.left.name);
            assemblyCode.push(`  lw ${leftReg}, ${leftOffset}(s0)`);
          }
          
          
          if (value.right.type === NodeType.LITERAL) {
            assemblyCode.push(`  li ${rightReg}, ${value.right.value}`);
          } else {
            const rightOffset = allocateVariable(value.right.name);
            assemblyCode.push(`  lw ${rightReg}, ${rightOffset}(s0)`);
          }
          
          
          switch (value.operator) {
            case '+':
              assemblyCode.push(`  add ${resultReg}, ${leftReg}, ${rightReg}`);
              break;
            case '-':
              assemblyCode.push(`  sub ${resultReg}, ${leftReg}, ${rightReg}`);
              break;
            case '*':
              
              assemblyCode.push(`  mul ${resultReg}, ${leftReg}, ${rightReg}`);
              break;
            case '/':
              
              assemblyCode.push(`  div ${resultReg}, ${leftReg}, ${rightReg}`);
              break;
            default:
              throw new Error(`Unsupported binary operator: ${value.operator}`);
          }
          
          
          assemblyCode.push(`  sw ${resultReg}, ${offset}(s0)`);
          
          
          regAllocator.freeTemp(leftReg);
          regAllocator.freeTemp(rightReg);
          regAllocator.freeTemp(resultReg);
        }
        break;
      }
      
      case NodeType.PRINT: {
        const { value } = statement;
        
        if (value.type === NodeType.LITERAL) {
          if (value.dataType === 'string') {
            
            const stringLabel = addStringLiteral(value.value);
            assemblyCode.push(`  la a0, ${stringLabel}`);  
            assemblyCode.push('  li a7, 4');              
            assemblyCode.push('  ecall');                 
          } else if (value.dataType === 'number') {
            
            assemblyCode.push(`  li a0, ${value.value}`);  
            assemblyCode.push('  li a7, 1');              
            assemblyCode.push('  ecall');                 
            
            
            assemblyCode.push('  li a0, 10');             
            assemblyCode.push('  li a7, 11');             
            assemblyCode.push('  ecall');
          }
        } else if (value.type === NodeType.VARIABLE) {
          
          const offset = allocateVariable(value.name);
          assemblyCode.push(`  lw a0, ${offset}(s0)`);    
          assemblyCode.push('  li a7, 1');               
          assemblyCode.push('  ecall');                  
          
          
          assemblyCode.push('  li a0, 10');              
          assemblyCode.push('  li a7, 11');              
          assemblyCode.push('  ecall');
        }
        break;
      }
      
      case NodeType.IF_STATEMENT: {
        const { condition, body, alternate } = statement;
        const elseLabel = generateLabel('else');
        const endIfLabel = generateLabel('endif');
        
        
        if (condition.type === NodeType.COMPARISON) {
          const leftReg = regAllocator.allocTemp();
          const rightReg = regAllocator.allocTemp();
          
          
          if (condition.left.type === NodeType.LITERAL) {
            assemblyCode.push(`  li ${leftReg}, ${condition.left.value}`);
          } else {
            const leftOffset = allocateVariable(condition.left.name);
            assemblyCode.push(`  lw ${leftReg}, ${leftOffset}(s0)`);
          }
          
          
          if (condition.right.type === NodeType.LITERAL) {
            assemblyCode.push(`  li ${rightReg}, ${condition.right.value}`);
          } else {
            const rightOffset = allocateVariable(condition.right.name);
            assemblyCode.push(`  lw ${rightReg}, ${rightOffset}(s0)`);
          }
          
          
          switch (condition.operator) {
            case '==':
              assemblyCode.push(`  bne ${leftReg}, ${rightReg}, ${alternate ? elseLabel : endIfLabel}`);
              break;
            case '!=':
              assemblyCode.push(`  beq ${leftReg}, ${rightReg}, ${alternate ? elseLabel : endIfLabel}`);
              break;
            case '<':
              assemblyCode.push(`  bge ${leftReg}, ${rightReg}, ${alternate ? elseLabel : endIfLabel}`);
              break;
            case '>':
              assemblyCode.push(`  ble ${leftReg}, ${rightReg}, ${alternate ? elseLabel : endIfLabel}`);
              break;
            case '<=':
              assemblyCode.push(`  bgt ${leftReg}, ${rightReg}, ${alternate ? elseLabel : endIfLabel}`);
              break;
            case '>=':
              assemblyCode.push(`  blt ${leftReg}, ${rightReg}, ${alternate ? elseLabel : endIfLabel}`);
              break;
            default:
              throw new Error(`Unsupported comparison operator: ${condition.operator}`);
          }
          
          
          regAllocator.freeTemp(leftReg);
          regAllocator.freeTemp(rightReg);
        }
        
        
        if (body.body.length > 0) {
          for (const bodyStatement of body.body) {
            
            
            
          }
        }
        
        
        if (alternate) {
          assemblyCode.push(`  j ${endIfLabel}`);
          assemblyCode.push(`${elseLabel}:`);
          
          
          
        }
        
        assemblyCode.push(`${endIfLabel}:`);
        break;
      }
      
      case NodeType.WHILE_LOOP: {
        const { condition, body } = statement;
        const startLoopLabel = generateLabel('while_start');
        const endLoopLabel = generateLabel('while_end');
        
        
        assemblyCode.push(`${startLoopLabel}:`);
        
        
        if (condition.type === NodeType.COMPARISON) {
          const leftReg = regAllocator.allocTemp();
          const rightReg = regAllocator.allocTemp();
          
          
          if (condition.left.type === NodeType.LITERAL) {
            assemblyCode.push(`  li ${leftReg}, ${condition.left.value}`);
          } else {
            const leftOffset = allocateVariable(condition.left.name);
            assemblyCode.push(`  lw ${leftReg}, ${leftOffset}(s0)`);
          }
          
          
          if (condition.right.type === NodeType.LITERAL) {
            assemblyCode.push(`  li ${rightReg}, ${condition.right.value}`);
          } else {
            const rightOffset = allocateVariable(condition.right.name);
            assemblyCode.push(`  lw ${rightReg}, ${rightOffset}(s0)`);
          }
          
          
          switch (condition.operator) {
            case '==':
              assemblyCode.push(`  bne ${leftReg}, ${rightReg}, ${endLoopLabel}`);
              break;
            case '!=':
              assemblyCode.push(`  beq ${leftReg}, ${rightReg}, ${endLoopLabel}`);
              break;
            case '<':
              assemblyCode.push(`  bge ${leftReg}, ${rightReg}, ${endLoopLabel}`);
              break;
            case '>':
              assemblyCode.push(`  ble ${leftReg}, ${rightReg}, ${endLoopLabel}`);
              break;
            case '<=':
              assemblyCode.push(`  bgt ${leftReg}, ${rightReg}, ${endLoopLabel}`);
              break;
            case '>=':
              assemblyCode.push(`  blt ${leftReg}, ${rightReg}, ${endLoopLabel}`);
              break;
            default:
              throw new Error(`Unsupported comparison operator: ${condition.operator}`);
          }
          
          
          regAllocator.freeTemp(leftReg);
          regAllocator.freeTemp(rightReg);
        }
        
        
        if (body.body.length > 0) {
          for (const bodyStatement of body.body) {
            
            
          }
        }
        
        
        assemblyCode.push(`  j ${startLoopLabel}`);
        assemblyCode.push(`${endLoopLabel}:`);
        break;
      }
    }
  }
  
  
  assemblyCode.push('  li a0, 0');        
  assemblyCode.push('  li a7, 10');       
  assemblyCode.push('  ecall');           
  
  return assemblyCode.join('\n');
};

/**
 * Main compilation function to convert Python/PyG to RISC-V assembly
 * @param {string} sourceCode - Source code to compile
 * @param {string} language - Source language ('python' or 'pyg')
 * @returns {string} Generated RISC-V assembly code
 */
export const compileToRISCV = (sourceCode, language = 'python') => {
  try {
    
    const pythonCode = language === 'pyg' ? PYGToPython(sourceCode) : sourceCode;
    
    
    const ast = parsePython(pythonCode);
    
    
    return generateAssembly(ast);
  } catch (error) {
    throw new Error(`Compilation error: ${error.message}`);
  }
};

export default { compileToRISCV, parsePython, generateAssembly }; 