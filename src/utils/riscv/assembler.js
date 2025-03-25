import { REGISTERS, RV32I_INSTRUCTIONS, PSEUDO_INSTRUCTIONS, DIRECTIVES } from './instructions';

/**
 * RISC-V Assembler
 * Converts assembly language to binary machine code
 */

const LABEL_PLACEHOLDER = Symbol('LABEL_PLACEHOLDER');

/**
 * Parse an assembly line into its components
 * @param {string} line - Line of assembly code
 * @returns {Object|null} Parsed instruction or null if not an instruction
 */
export const parseLine = (line) => {
  
  const commentIndex = line.indexOf('#');
  const cleanLine = (commentIndex !== -1 ? line.substring(0, commentIndex) : line).trim();
  
  if (!cleanLine) return null;
  
  
  if (cleanLine.startsWith('.')) {
    const [directive, ...args] = cleanLine.split(/\s+/);
    return {
      type: 'directive',
      directive,
      args
    };
  }
  
  
  if (cleanLine.endsWith(':')) {
    return {
      type: 'label',
      label: cleanLine.slice(0, -1).trim()
    };
  }
  
  
  
  let label = null;
  let instructionText = cleanLine;
  
  const labelColonIndex = cleanLine.indexOf(':');
  if (labelColonIndex !== -1) {
    label = cleanLine.substring(0, labelColonIndex).trim();
    instructionText = cleanLine.substring(labelColonIndex + 1).trim();
  }
  
  
  const parts = instructionText.split(/\s+/);
  const opcode = parts[0].toLowerCase();
  const operands = parts.slice(1).join(' ').split(',').map(op => op.trim());
  
  return {
    type: 'instruction',
    label,
    opcode,
    operands
  };
};

/**
 * Resolves a register reference to its number
 * @param {string} reg - Register reference (e.g., 'x1', 'ra')
 * @returns {number} Register number
 */
export const resolveRegister = (reg) => {
  
  if (reg.startsWith('x') && !isNaN(parseInt(reg.slice(1)))) {
    const regNum = parseInt(reg.slice(1));
    if (regNum >= 0 && regNum <= 31) {
      return regNum;
    }
  }
  
  
  for (const [regName, info] of Object.entries(REGISTERS)) {
    if (reg === info.alias) {
      return parseInt(regName.slice(1));
    }
  }
  
  throw new Error(`Invalid register reference: ${reg}`);
};

/**
 * Evaluate an immediate value expression
 * @param {string} imm - Immediate value expression
 * @param {Object} labels - Map of labels to addresses
 * @param {number} pc - Current program counter
 * @returns {number} Resolved immediate value
 */
export const evaluateImmediate = (imm, labels = {}, pc = 0) => {
  
  if (/^-?\d+$/.test(imm)) {
    return parseInt(imm, 10);
  }
  
  
  if (/^0x[0-9a-f]+$/i.test(imm)) {
    return parseInt(imm, 16);
  }
  
  
  if (labels[imm] !== undefined) {
    if (labels[imm] === LABEL_PLACEHOLDER) {
      throw new Error(`Label "${imm}" not resolved yet`);
    }
    return labels[imm] - pc; 
  }
  
  
  const labelMatch = imm.match(/^([a-zA-Z_][a-zA-Z0-9_]*)([+-]\d+)?$/);
  if (labelMatch) {
    const label = labelMatch[1];
    const offset = labelMatch[2] ? parseInt(labelMatch[2]) : 0;
    
    if (labels[label] === undefined) {
      throw new Error(`Unknown label: ${label}`);
    }
    
    if (labels[label] === LABEL_PLACEHOLDER) {
      throw new Error(`Label "${label}" not resolved yet`);
    }
    
    return (labels[label] - pc) + offset;
  }
  
  throw new Error(`Invalid immediate value: ${imm}`);
};

/**
 * Encode an R-type instruction (register-register)
 * @param {string} opcode - Instruction opcode
 * @param {Array<string>} operands - Instruction operands
 * @returns {number} Encoded 32-bit instruction
 */
export const encodeRType = (opcode, operands) => {
  
  if (operands.length !== 3) {
    throw new Error(`R-type instruction ${opcode} requires 3 operands, got ${operands.length}`);
  }
  
  const rd = resolveRegister(operands[0]);
  const rs1 = resolveRegister(operands[1]);
  const rs2 = resolveRegister(operands[2]);
  
  
  const instr = Object.values(RV32I_INSTRUCTIONS).find(
    i => i.name === opcode && i.format === 'R-type'
  );
  
  if (!instr) {
    throw new Error(`Unknown R-type instruction: ${opcode}`);
  }
  
  
  
  
  const baseOpcodeMap = {
    'add': 0x33, 'sub': 0x33, 'sll': 0x33, 'srl': 0x33, 'sra': 0x33,
    'and': 0x33, 'or': 0x33, 'xor': 0x33, 'slt': 0x33, 'sltu': 0x33
  };
  
  const funct3Map = {
    'add': 0x0, 'sub': 0x0, 'sll': 0x1, 'srl': 0x5, 'sra': 0x5,
    'and': 0x7, 'or': 0x6, 'xor': 0x4, 'slt': 0x2, 'sltu': 0x3
  };
  
  const funct7Map = {
    'add': 0x00, 'sub': 0x20, 'sll': 0x00, 'srl': 0x00, 'sra': 0x20,
    'and': 0x00, 'or': 0x00, 'xor': 0x00, 'slt': 0x00, 'sltu': 0x00
  };
  
  const baseOpcode = baseOpcodeMap[opcode] || 0x33;
  const funct3 = funct3Map[opcode] || 0;
  const funct7 = funct7Map[opcode] || 0;
  
  return (funct7 << 25) | (rs2 << 20) | (rs1 << 15) | (funct3 << 12) | (rd << 7) | baseOpcode;
};

/**
 * Encode an I-type instruction (immediate)
 * @param {string} opcode - Instruction opcode
 * @param {Array<string>} operands - Instruction operands
 * @param {Object} labels - Map of labels to addresses
 * @param {number} pc - Current program counter
 * @returns {number} Encoded 32-bit instruction
 */
export const encodeIType = (opcode, operands, labels = {}, pc = 0) => {
  
  
  
  
  
  let rd, rs1, imm;
  
  if (opcode.startsWith('l')) { 
    if (operands.length !== 2) {
      throw new Error(`Load instruction ${opcode} requires 2 operands, got ${operands.length}`);
    }
    
    rd = resolveRegister(operands[0]);
    
    
    const offsetRegMatch = operands[1].match(/^(-?\d+)\(([^)]+)\)$/);
    if (!offsetRegMatch) {
      throw new Error(`Invalid operand format for ${opcode}: ${operands[1]}`);
    }
    
    imm = parseInt(offsetRegMatch[1], 10);
    rs1 = resolveRegister(offsetRegMatch[2]);
  } else { 
    if (operands.length !== 3) {
      throw new Error(`I-type instruction ${opcode} requires 3 operands, got ${operands.length}`);
    }
    
    rd = resolveRegister(operands[0]);
    rs1 = resolveRegister(operands[1]);
    imm = evaluateImmediate(operands[2], labels, pc);
  }
  
  
  if (imm < -2048 || imm > 2047) {
    throw new Error(`Immediate value ${imm} out of range for I-type instruction`);
  }
  
  
  const baseOpcodeMap = {
    'addi': 0x13, 'slti': 0x13, 'sltiu': 0x13, 'xori': 0x13, 'ori': 0x13, 'andi': 0x13,
    'slli': 0x13, 'srli': 0x13, 'srai': 0x13,
    'lb': 0x03, 'lh': 0x03, 'lw': 0x03, 'lbu': 0x03, 'lhu': 0x03,
    'jalr': 0x67
  };
  
  const funct3Map = {
    'addi': 0x0, 'slti': 0x2, 'sltiu': 0x3, 'xori': 0x4, 'ori': 0x6, 'andi': 0x7,
    'slli': 0x1, 'srli': 0x5, 'srai': 0x5,
    'lb': 0x0, 'lh': 0x1, 'lw': 0x2, 'lbu': 0x4, 'lhu': 0x5,
    'jalr': 0x0
  };
  
  const baseOpcode = baseOpcodeMap[opcode] || 0x13;
  const funct3 = funct3Map[opcode] || 0;
  
  
  let immEncoded = imm & 0xFFF; 
  
  return (immEncoded << 20) | (rs1 << 15) | (funct3 << 12) | (rd << 7) | baseOpcode;
};

/**
 * First pass of assembly to collect labels and their addresses
 * @param {string} assembly - Assembly code text
 * @returns {Object} Map of labels to addresses
 */
export const collectLabels = (assembly) => {
  const lines = assembly.split('\n');
  const labels = {};
  let address = 0;
  
  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    
    if (parsed.type === 'label') {
      labels[parsed.label] = address;
      continue;
    }
    
    if (parsed.type === 'instruction') {
      if (parsed.label) {
        labels[parsed.label] = address;
      }
      address += 4; 
    }
    
    
    if (parsed.type === 'directive') {
      
      if (parsed.directive === DIRECTIVES.ALIGN) {
        const alignment = parseInt(parsed.args[0] || '4', 10);
        address = Math.ceil(address / alignment) * alignment;
      } else if ([DIRECTIVES.BYTE, DIRECTIVES.HALF, DIRECTIVES.WORD].includes(parsed.directive)) {
        const count = parsed.args.length;
        const size = parsed.directive === DIRECTIVES.BYTE ? 1 : 
                    parsed.directive === DIRECTIVES.HALF ? 2 : 4;
        address += count * size;
      } else if (parsed.directive === DIRECTIVES.STRING) {
        
        address += parsed.args.join(' ').length + 1;
      }
    }
  }
  
  return labels;
};

/**
 * Assemble RISC-V assembly code to machine code
 * @param {string} assembly - Assembly code text
 * @returns {Uint8Array} Binary machine code
 */
export const assemble = (assembly) => {
  const lines = assembly.split('\n');
  
  
  const labels = collectLabels(assembly);
  
  
  const instructions = [];
  let pc = 0;
  
  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed || parsed.type !== 'instruction') continue;
    
    const { opcode, operands } = parsed;
    let encodedInstruction;
    
    
    const pseudoInstr = Object.values(PSEUDO_INSTRUCTIONS).find(p => p.name === opcode);
    if (pseudoInstr) {
      
      if (typeof pseudoInstr.expansion === 'string') {
        const expandedInstr = pseudoInstr.expansion;
        
        
        const parts = expandedInstr.split(/\s+/);
        const actualOpcode = parts[0];
        
      }
      
      instructions.push(0); 
    } else {
      
      const instrDef = Object.values(RV32I_INSTRUCTIONS).find(i => i.name === opcode);
      
      if (!instrDef) {
        throw new Error(`Unknown instruction: ${opcode}`);
      }
      
      switch (instrDef.format) {
        case 'R-type':
          encodedInstruction = encodeRType(opcode, operands);
          break;
        case 'I-type':
          encodedInstruction = encodeIType(opcode, operands, labels, pc);
          break;
        
        default:
          throw new Error(`Unsupported instruction format: ${instrDef.format}`);
      }
      
      instructions.push(encodedInstruction);
    }
    
    pc += 4; 
  }
  
  
  const buffer = new Uint8Array(instructions.length * 4);
  instructions.forEach((instr, index) => {
    buffer[index * 4] = instr & 0xFF;
    buffer[index * 4 + 1] = (instr >> 8) & 0xFF;
    buffer[index * 4 + 2] = (instr >> 16) & 0xFF;
    buffer[index * 4 + 3] = (instr >> 24) & 0xFF;
  });
  
  return buffer;
};

/**
 * Convert binary machine code to hex representation
 * @param {Uint8Array} binary - Binary machine code
 * @returns {string} Hex representation
 */
export const binaryToHex = (binary) => {
  return Array.from(binary)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Pretty-print assembled code with addresses and hex values
 * @param {Uint8Array} binary - Binary machine code
 * @returns {string} Formatted hex dump
 */
export const formatHexDump = (binary) => {
  const lines = [];
  for (let i = 0; i < binary.length; i += 4) {
    const address = i.toString(16).padStart(8, '0');
    const bytes = Array.from(binary.slice(i, i + 4))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join(' ');
    lines.push(`0x${address}: ${bytes}`);
  }
  return lines.join('\n');
};

export default {
  assemble,
  parseLine,
  binaryToHex,
  formatHexDump
}; 