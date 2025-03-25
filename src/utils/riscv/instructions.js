/**
 * RISC-V Instruction Set Definitions
 * Primarily supporting RV32I base instruction set
 */


const INSTRUCTION_FORMATS = {
  R_TYPE: 'R-type', 
  I_TYPE: 'I-type', 
  S_TYPE: 'S-type', 
  B_TYPE: 'B-type', 
  U_TYPE: 'U-type', 
  J_TYPE: 'J-type', 
};


const RV32I_INSTRUCTIONS = {
  
  ADD: {
    name: 'add',
    format: INSTRUCTION_FORMATS.R_TYPE,
    syntax: 'add rd, rs1, rs2',
    description: 'Add values from registers rs1 and rs2, store in rd',
    pseudocode: 'rd = rs1 + rs2',
  },
  SUB: {
    name: 'sub',
    format: INSTRUCTION_FORMATS.R_TYPE,
    syntax: 'sub rd, rs1, rs2',
    description: 'Subtract rs2 from rs1, store in rd',
    pseudocode: 'rd = rs1 - rs2',
  },
  ADDI: {
    name: 'addi',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'addi rd, rs1, imm',
    description: 'Add immediate value to rs1, store in rd',
    pseudocode: 'rd = rs1 + imm',
  },

  
  AND: {
    name: 'and',
    format: INSTRUCTION_FORMATS.R_TYPE,
    syntax: 'and rd, rs1, rs2',
    description: 'Bitwise AND of rs1 and rs2, store in rd',
    pseudocode: 'rd = rs1 & rs2',
  },
  OR: {
    name: 'or',
    format: INSTRUCTION_FORMATS.R_TYPE,
    syntax: 'or rd, rs1, rs2',
    description: 'Bitwise OR of rs1 and rs2, store in rd',
    pseudocode: 'rd = rs1 | rs2',
  },
  XOR: {
    name: 'xor',
    format: INSTRUCTION_FORMATS.R_TYPE,
    syntax: 'xor rd, rs1, rs2',
    description: 'Bitwise XOR of rs1 and rs2, store in rd',
    pseudocode: 'rd = rs1 ^ rs2',
  },
  ANDI: {
    name: 'andi',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'andi rd, rs1, imm',
    description: 'Bitwise AND of rs1 and immediate, store in rd',
    pseudocode: 'rd = rs1 & imm',
  },
  ORI: {
    name: 'ori',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'ori rd, rs1, imm',
    description: 'Bitwise OR of rs1 and immediate, store in rd',
    pseudocode: 'rd = rs1 | imm',
  },
  XORI: {
    name: 'xori',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'xori rd, rs1, imm',
    description: 'Bitwise XOR of rs1 and immediate, store in rd',
    pseudocode: 'rd = rs1 ^ imm',
  },

  
  SLL: {
    name: 'sll',
    format: INSTRUCTION_FORMATS.R_TYPE,
    syntax: 'sll rd, rs1, rs2',
    description: 'Logical left shift rs1 by rs2, store in rd',
    pseudocode: 'rd = rs1 << rs2',
  },
  SRL: {
    name: 'srl',
    format: INSTRUCTION_FORMATS.R_TYPE,
    syntax: 'srl rd, rs1, rs2',
    description: 'Logical right shift rs1 by rs2, store in rd',
    pseudocode: 'rd = rs1 >> rs2',
  },
  SRA: {
    name: 'sra',
    format: INSTRUCTION_FORMATS.R_TYPE,
    syntax: 'sra rd, rs1, rs2',
    description: 'Arithmetic right shift rs1 by rs2, store in rd',
    pseudocode: 'rd = rs1 >>> rs2',
  },
  SLLI: {
    name: 'slli',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'slli rd, rs1, imm',
    description: 'Logical left shift rs1 by immediate, store in rd',
    pseudocode: 'rd = rs1 << imm',
  },
  SRLI: {
    name: 'srli',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'srli rd, rs1, imm',
    description: 'Logical right shift rs1 by immediate, store in rd',
    pseudocode: 'rd = rs1 >> imm',
  },
  SRAI: {
    name: 'srai',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'srai rd, rs1, imm',
    description: 'Arithmetic right shift rs1 by immediate, store in rd',
    pseudocode: 'rd = rs1 >>> imm',
  },

  
  SLT: {
    name: 'slt',
    format: INSTRUCTION_FORMATS.R_TYPE,
    syntax: 'slt rd, rs1, rs2',
    description: 'Set rd to 1 if rs1 < rs2 (signed), else 0',
    pseudocode: 'rd = (rs1 < rs2) ? 1 : 0',
  },
  SLTU: {
    name: 'sltu',
    format: INSTRUCTION_FORMATS.R_TYPE,
    syntax: 'sltu rd, rs1, rs2',
    description: 'Set rd to 1 if rs1 < rs2 (unsigned), else 0',
    pseudocode: 'rd = (rs1 <u rs2) ? 1 : 0',
  },
  SLTI: {
    name: 'slti',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'slti rd, rs1, imm',
    description: 'Set rd to 1 if rs1 < imm (signed), else 0',
    pseudocode: 'rd = (rs1 < imm) ? 1 : 0',
  },
  SLTIU: {
    name: 'sltiu',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'sltiu rd, rs1, imm',
    description: 'Set rd to 1 if rs1 < imm (unsigned), else 0',
    pseudocode: 'rd = (rs1 <u imm) ? 1 : 0',
  },

  
  BEQ: {
    name: 'beq',
    format: INSTRUCTION_FORMATS.B_TYPE,
    syntax: 'beq rs1, rs2, offset',
    description: 'Branch to PC+offset if rs1 == rs2',
    pseudocode: 'if (rs1 == rs2) PC += offset',
  },
  BNE: {
    name: 'bne',
    format: INSTRUCTION_FORMATS.B_TYPE,
    syntax: 'bne rs1, rs2, offset',
    description: 'Branch to PC+offset if rs1 != rs2',
    pseudocode: 'if (rs1 != rs2) PC += offset',
  },
  BLT: {
    name: 'blt',
    format: INSTRUCTION_FORMATS.B_TYPE,
    syntax: 'blt rs1, rs2, offset',
    description: 'Branch to PC+offset if rs1 < rs2 (signed)',
    pseudocode: 'if (rs1 < rs2) PC += offset',
  },
  BGE: {
    name: 'bge',
    format: INSTRUCTION_FORMATS.B_TYPE,
    syntax: 'bge rs1, rs2, offset',
    description: 'Branch to PC+offset if rs1 >= rs2 (signed)',
    pseudocode: 'if (rs1 >= rs2) PC += offset',
  },
  BLTU: {
    name: 'bltu',
    format: INSTRUCTION_FORMATS.B_TYPE,
    syntax: 'bltu rs1, rs2, offset',
    description: 'Branch to PC+offset if rs1 < rs2 (unsigned)',
    pseudocode: 'if (rs1 <u rs2) PC += offset',
  },
  BGEU: {
    name: 'bgeu',
    format: INSTRUCTION_FORMATS.B_TYPE,
    syntax: 'bgeu rs1, rs2, offset',
    description: 'Branch to PC+offset if rs1 >= rs2 (unsigned)',
    pseudocode: 'if (rs1 >=u rs2) PC += offset',
  },

  
  JAL: {
    name: 'jal',
    format: INSTRUCTION_FORMATS.J_TYPE,
    syntax: 'jal rd, offset',
    description: 'Jump to PC+offset, store return address in rd',
    pseudocode: 'rd = PC+4; PC += offset',
  },
  JALR: {
    name: 'jalr',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'jalr rd, rs1, offset',
    description: 'Jump to rs1+offset, store return address in rd',
    pseudocode: 'rd = PC+4; PC = rs1 + offset',
  },

  
  LW: {
    name: 'lw',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'lw rd, offset(rs1)',
    description: 'Load word from memory at rs1+offset into rd',
    pseudocode: 'rd = MEM[rs1 + offset]',
  },
  LH: {
    name: 'lh',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'lh rd, offset(rs1)',
    description: 'Load halfword from memory at rs1+offset into rd (sign-extended)',
    pseudocode: 'rd = sext(MEM[rs1 + offset][15:0])',
  },
  LHU: {
    name: 'lhu',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'lhu rd, offset(rs1)',
    description: 'Load halfword from memory at rs1+offset into rd (zero-extended)',
    pseudocode: 'rd = MEM[rs1 + offset][15:0]',
  },
  LB: {
    name: 'lb',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'lb rd, offset(rs1)',
    description: 'Load byte from memory at rs1+offset into rd (sign-extended)',
    pseudocode: 'rd = sext(MEM[rs1 + offset][7:0])',
  },
  LBU: {
    name: 'lbu',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'lbu rd, offset(rs1)',
    description: 'Load byte from memory at rs1+offset into rd (zero-extended)',
    pseudocode: 'rd = MEM[rs1 + offset][7:0]',
  },

  
  SW: {
    name: 'sw',
    format: INSTRUCTION_FORMATS.S_TYPE,
    syntax: 'sw rs2, offset(rs1)',
    description: 'Store word from rs2 to memory at rs1+offset',
    pseudocode: 'MEM[rs1 + offset] = rs2',
  },
  SH: {
    name: 'sh',
    format: INSTRUCTION_FORMATS.S_TYPE,
    syntax: 'sh rs2, offset(rs1)',
    description: 'Store halfword from rs2 to memory at rs1+offset',
    pseudocode: 'MEM[rs1 + offset][15:0] = rs2[15:0]',
  },
  SB: {
    name: 'sb',
    format: INSTRUCTION_FORMATS.S_TYPE,
    syntax: 'sb rs2, offset(rs1)',
    description: 'Store byte from rs2 to memory at rs1+offset',
    pseudocode: 'MEM[rs1 + offset][7:0] = rs2[7:0]',
  },

  
  LUI: {
    name: 'lui',
    format: INSTRUCTION_FORMATS.U_TYPE,
    syntax: 'lui rd, imm',
    description: 'Load upper immediate value to rd',
    pseudocode: 'rd = imm << 12',
  },
  AUIPC: {
    name: 'auipc',
    format: INSTRUCTION_FORMATS.U_TYPE,
    syntax: 'auipc rd, imm',
    description: 'Add upper immediate to PC, store in rd',
    pseudocode: 'rd = PC + (imm << 12)',
  },

  
  FENCE: {
    name: 'fence',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'fence pred, succ',
    description: 'Fence for synchronizing memory accesses',
    pseudocode: 'Fence(pred, succ)',
  },
  ECALL: {
    name: 'ecall',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'ecall',
    description: 'Make a system call',
    pseudocode: 'SystemCall()',
  },
  EBREAK: {
    name: 'ebreak',
    format: INSTRUCTION_FORMATS.I_TYPE,
    syntax: 'ebreak',
    description: 'Make a debugger breakpoint',
    pseudocode: 'DebugBreakpoint()',
  },
};


const PSEUDO_INSTRUCTIONS = {
  NOP: {
    name: 'nop',
    syntax: 'nop',
    description: 'No operation (equivalent to addi x0, x0, 0)',
    expansion: 'addi x0, x0, 0',
  },
  MV: {
    name: 'mv',
    syntax: 'mv rd, rs',
    description: 'Copy value from rs to rd (equivalent to addi rd, rs, 0)',
    expansion: 'addi {0}, {1}, 0',
  },
  LI: {
    name: 'li',
    syntax: 'li rd, imm',
    description: 'Load immediate value to rd',
    expansion: ['lui {0}, hi20({1})', 'addi {0}, {0}, lo12({1})'],
  },
  J: {
    name: 'j',
    syntax: 'j offset',
    description: 'Jump to PC+offset (equivalent to jal x0, offset)',
    expansion: 'jal x0, {0}',
  },
  JR: {
    name: 'jr',
    syntax: 'jr rs',
    description: 'Jump to address in rs (equivalent to jalr x0, rs, 0)',
    expansion: 'jalr x0, {0}, 0',
  },
  RET: {
    name: 'ret',
    syntax: 'ret',
    description: 'Return from subroutine (equivalent to jalr x0, x1, 0)',
    expansion: 'jalr x0, x1, 0',
  },
  CALL: {
    name: 'call',
    syntax: 'call offset',
    description: 'Call a subroutine at PC+offset',
    expansion: ['auipc x1, hi20({0})', 'jalr x1, x1, lo12({0})'],
  },
  TAIL: {
    name: 'tail',
    syntax: 'tail offset',
    description: 'Tail call a subroutine at PC+offset',
    expansion: ['auipc x6, hi20({0})', 'jalr x0, x6, lo12({0})'],
  },
  BRANCH_PSEUDO: {
    
    BLT: {
      name: 'ble',
      syntax: 'ble rs, rt, offset',
      description: 'Branch if less than or equal',
      expansion: 'bge {1}, {0}, {2}',
    },
    BGT: {
      name: 'bgt',
      syntax: 'bgt rs, rt, offset',
      description: 'Branch if greater than',
      expansion: 'blt {1}, {0}, {2}',
    },
    BLEU: {
      name: 'bleu',
      syntax: 'bleu rs, rt, offset',
      description: 'Branch if less than or equal (unsigned)',
      expansion: 'bgeu {1}, {0}, {2}',
    },
    BGTU: {
      name: 'bgtu',
      syntax: 'bgtu rs, rt, offset',
      description: 'Branch if greater than (unsigned)',
      expansion: 'bltu {1}, {0}, {2}',
    },
  },
};


const REGISTERS = {
  x0: { name: 'x0', alias: 'zero', description: 'Hard-wired zero' },
  x1: { name: 'x1', alias: 'ra', description: 'Return address' },
  x2: { name: 'x2', alias: 'sp', description: 'Stack pointer' },
  x3: { name: 'x3', alias: 'gp', description: 'Global pointer' },
  x4: { name: 'x4', alias: 'tp', description: 'Thread pointer' },
  x5: { name: 'x5', alias: 't0', description: 'Temporary/alternate link register' },
  x6: { name: 'x6', alias: 't1', description: 'Temporary' },
  x7: { name: 'x7', alias: 't2', description: 'Temporary' },
  x8: { name: 'x8', alias: 's0/fp', description: 'Saved register/frame pointer' },
  x9: { name: 'x9', alias: 's1', description: 'Saved register' },
  x10: { name: 'x10', alias: 'a0', description: 'Function argument/return value' },
  x11: { name: 'x11', alias: 'a1', description: 'Function argument/return value' },
  x12: { name: 'x12', alias: 'a2', description: 'Function argument' },
  x13: { name: 'x13', alias: 'a3', description: 'Function argument' },
  x14: { name: 'x14', alias: 'a4', description: 'Function argument' },
  x15: { name: 'x15', alias: 'a5', description: 'Function argument' },
  x16: { name: 'x16', alias: 'a6', description: 'Function argument' },
  x17: { name: 'x17', alias: 'a7', description: 'Function argument' },
  x18: { name: 'x18', alias: 's2', description: 'Saved register' },
  x19: { name: 'x19', alias: 's3', description: 'Saved register' },
  x20: { name: 'x20', alias: 's4', description: 'Saved register' },
  x21: { name: 'x21', alias: 's5', description: 'Saved register' },
  x22: { name: 'x22', alias: 's6', description: 'Saved register' },
  x23: { name: 'x23', alias: 's7', description: 'Saved register' },
  x24: { name: 'x24', alias: 's8', description: 'Saved register' },
  x25: { name: 'x25', alias: 's9', description: 'Saved register' },
  x26: { name: 'x26', alias: 's10', description: 'Saved register' },
  x27: { name: 'x27', alias: 's11', description: 'Saved register' },
  x28: { name: 'x28', alias: 't3', description: 'Temporary' },
  x29: { name: 'x29', alias: 't4', description: 'Temporary' },
  x30: { name: 'x30', alias: 't5', description: 'Temporary' },
  x31: { name: 'x31', alias: 't6', description: 'Temporary' },
};


const DIRECTIVES = {
  TEXT: '.text',
  DATA: '.data',
  RODATA: '.rodata',
  BSS: '.bss',
  BYTE: '.byte',
  HALF: '.half',
  WORD: '.word',
  STRING: '.string',
  ALIGN: '.align',
  GLOBAL: '.global',
};

export {
  INSTRUCTION_FORMATS,
  RV32I_INSTRUCTIONS,
  PSEUDO_INSTRUCTIONS,
  REGISTERS,
  DIRECTIVES,
}; 