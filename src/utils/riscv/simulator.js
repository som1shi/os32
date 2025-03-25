import { REGISTERS, RV32I_INSTRUCTIONS, DIRECTIVES } from './instructions';
import { parseLine } from './assembler';

/**
 * RISC-V Simulator
 * A simple simulator for RISC-V assembly code
 */


const MEMORY_SIZE = 4 * 1024 * 1024;


const TEXT_SECTION_START = 0x10000;
const DATA_SECTION_START = 0x20000;
const STACK_SECTION_START = 0x70000;
const STACK_SIZE = 0x10000;

class RISCVSimulator {
  constructor() {
    
    this.memory = new Uint8Array(MEMORY_SIZE);
    
    
    this.registers = new Int32Array(32);
    
    
    this.pc = TEXT_SECTION_START;
    
    
    this.registers[2] = STACK_SECTION_START + STACK_SIZE;
    
    
    this.currentSection = '.text';
    
    
    this.sectionAddresses = {
      '.text': TEXT_SECTION_START,
      '.data': DATA_SECTION_START
    };
    
    
    this.symbols = {};
    
    
    this.instructionCount = 0;
    
    
    this.maxInstructions = 10000;
    
    
    this.output = '';
    
    
    this.halted = false;
    
    
    this.outputCallback = null;
  }
  
  /**
   * Reset the simulator to initial state
   */
  reset() {
    this.memory = new Uint8Array(MEMORY_SIZE);
    this.registers = new Int32Array(32);
    this.pc = TEXT_SECTION_START;
    this.registers[2] = STACK_SECTION_START + STACK_SIZE;
    this.currentSection = '.text';
    this.sectionAddresses = {
      '.text': TEXT_SECTION_START,
      '.data': DATA_SECTION_START
    };
    this.symbols = {};
    this.instructionCount = 0;
    this.output = '';
    this.halted = false;
  }
  
  /**
   * Set output callback function
   * @param {Function} callback - Function to call with output text
   */
  setOutputCallback(callback) {
    this.outputCallback = callback;
  }
  
  /**
   * Load a program into memory
   * @param {string} assembly - Assembly code to load
   */
  loadProgram(assembly) {
    this.reset();
    
    
    this.firstPass(assembly);
    
    
    this.secondPass(assembly);
    
    
    if (this.symbols['main']) {
      this.pc = this.symbols['main'];
    } else {
      this.pc = TEXT_SECTION_START;
    }
  }
  
  /**
   * First pass: scan for labels and memory layout
   * @param {string} assembly - Assembly code
   */
  firstPass(assembly) {
    const lines = assembly.split('\n');
    
    for (const line of lines) {
      const parsed = parseLine(line);
      if (!parsed) continue;
      
      if (parsed.type === 'directive') {
        
        if (['.text', '.data', '.rodata', '.bss'].includes(parsed.directive)) {
          this.currentSection = parsed.directive;
        }
        
        else if (['.byte', '.half', '.word'].includes(parsed.directive)) {
          const size = parsed.directive === '.byte' ? 1 : 
                       parsed.directive === '.half' ? 2 : 4;
          
          this.sectionAddresses[this.currentSection] += size * parsed.args.length;
        }
        
        else if (parsed.directive === '.string') {
          
          const strLength = parsed.args.join(' ').length + 1;
          this.sectionAddresses[this.currentSection] += strLength;
        }
        
        else if (parsed.directive === '.align') {
          const alignment = parseInt(parsed.args[0] || '4', 10);
          const currentAddr = this.sectionAddresses[this.currentSection];
          const alignedAddr = Math.ceil(currentAddr / alignment) * alignment;
          this.sectionAddresses[this.currentSection] = alignedAddr;
        }
      }
      
      else if (parsed.type === 'label' || parsed.label) {
        const labelName = parsed.type === 'label' ? parsed.label : parsed.label;
        this.symbols[labelName] = this.sectionAddresses[this.currentSection];
      }
      
      
      if (parsed.type === 'instruction') {
        this.sectionAddresses[this.currentSection] += 4; 
      }
    }
  }
  
  /**
   * Second pass: process instructions and data
   * @param {string} assembly - Assembly code
   */
  secondPass(assembly) {
    const lines = assembly.split('\n');
    
    
    this.sectionAddresses = {
      '.text': TEXT_SECTION_START,
      '.data': DATA_SECTION_START
    };
    
    this.currentSection = '.text';
    
    for (const line of lines) {
      const parsed = parseLine(line);
      if (!parsed) continue;
      
      if (parsed.type === 'directive') {
        
        if (['.text', '.data', '.rodata', '.bss'].includes(parsed.directive)) {
          this.currentSection = parsed.directive;
        }
        
        else if (parsed.directive === '.byte') {
          for (const arg of parsed.args) {
            const value = parseInt(arg, 10);
            this.memory[this.sectionAddresses[this.currentSection]] = value & 0xFF;
            this.sectionAddresses[this.currentSection] += 1;
          }
        }
        else if (parsed.directive === '.half') {
          for (const arg of parsed.args) {
            const value = parseInt(arg, 10);
            this.memory[this.sectionAddresses[this.currentSection]] = value & 0xFF;
            this.memory[this.sectionAddresses[this.currentSection] + 1] = (value >> 8) & 0xFF;
            this.sectionAddresses[this.currentSection] += 2;
          }
        }
        else if (parsed.directive === '.word') {
          for (const arg of parsed.args) {
            const value = parseInt(arg, 10);
            this.memory[this.sectionAddresses[this.currentSection]] = value & 0xFF;
            this.memory[this.sectionAddresses[this.currentSection] + 1] = (value >> 8) & 0xFF;
            this.memory[this.sectionAddresses[this.currentSection] + 2] = (value >> 16) & 0xFF;
            this.memory[this.sectionAddresses[this.currentSection] + 3] = (value >> 24) & 0xFF;
            this.sectionAddresses[this.currentSection] += 4;
          }
        }
        
        else if (parsed.directive === '.string') {
          const str = parsed.args.join(' ').replace(/^"|"$/g, '');
          for (let i = 0; i < str.length; i++) {
            this.memory[this.sectionAddresses[this.currentSection] + i] = str.charCodeAt(i);
          }
          
          this.memory[this.sectionAddresses[this.currentSection] + str.length] = 0;
          this.sectionAddresses[this.currentSection] += str.length + 1;
        }
        
        else if (parsed.directive === '.align') {
          const alignment = parseInt(parsed.args[0] || '4', 10);
          const currentAddr = this.sectionAddresses[this.currentSection];
          const alignedAddr = Math.ceil(currentAddr / alignment) * alignment;
          this.sectionAddresses[this.currentSection] = alignedAddr;
        }
      }
      
      else if (parsed.type === 'instruction') {
        
        const instrAddr = this.sectionAddresses[this.currentSection];
        
        
        
        
        this.sectionAddresses[this.currentSection] += 4; 
      }
    }
  }
  
  /**
   * Run the loaded program
   * @param {number} maxInstructions - Maximum number of instructions to execute
   * @returns {string} Program output
   */
  run(maxInstructions = 10000) {
    this.maxInstructions = maxInstructions;
    this.instructionCount = 0;
    this.output = '';
    this.halted = false;
    
    try {
      while (!this.halted && this.instructionCount < this.maxInstructions) {
        this.step();
      }
      
      if (this.instructionCount >= this.maxInstructions) {
        this.appendOutput('\nExecution halted: Maximum instruction count reached');
      }
      
      return this.output;
    } catch (error) {
      this.appendOutput(`\nExecution error: ${error.message}`);
      return this.output;
    }
  }
  
  /**
   * Execute a single instruction
   */
  step() {
    
    this.registers[0] = 0;
    
    
    const instruction = this.fetchInstruction(this.pc);
    
    
    this.pc += 4;
    
    
    this.executeInstruction(instruction);
    
    
    this.instructionCount++;
  }
  
  /**
   * Fetch instruction from memory
   * @param {number} address - Memory address
   * @returns {number} 32-bit instruction
   */
  fetchInstruction(address) {
    
    const byte0 = this.memory[address];
    const byte1 = this.memory[address + 1];
    const byte2 = this.memory[address + 2];
    const byte3 = this.memory[address + 3];
    
    
    return byte0 | (byte1 << 8) | (byte2 << 16) | (byte3 << 24);
  }
  
  /**
   * Execute a single instruction
   * @param {number} instruction - 32-bit instruction
   */
  executeInstruction(instruction) {
    
    
    
    const opcode = instruction & 0x7F;
    
    
    if (opcode === 0x73) {
      const funct3 = (instruction >> 12) & 0x7;
      const funct7 = (instruction >> 25) & 0x7F;
      const rs2 = (instruction >> 20) & 0x1F;
      
      
      if (funct3 === 0x0 && rs2 === 0x0 && funct7 === 0x0) {
        
        const syscallNumber = this.registers[17]; 
        
        switch (syscallNumber) {
          case 1: 
            const intValue = this.registers[10]; 
            this.appendOutput(`${intValue}`);
            break;
            
          case 4: 
            const strAddr = this.registers[10]; 
            let str = '';
            let i = 0;
            while (this.memory[strAddr + i] !== 0) {
              str += String.fromCharCode(this.memory[strAddr + i]);
              i++;
              
              if (i > 1000) break;
            }
            this.appendOutput(str);
            break;
          
          case 5: 
            
            
            this.registers[10] = 42; 
            break;
            
          case 10: 
            this.halted = true;
            break;
            
          case 11: 
            const charVal = this.registers[10]; 
            this.appendOutput(String.fromCharCode(charVal));
            break;
            
          default:
            throw new Error(`Unsupported syscall: ${syscallNumber}`);
        }
        return;
      }
    }
    
    
    
    
    
    
    if (opcode === 0x33) {
      const rd = (instruction >> 7) & 0x1F;
      const funct3 = (instruction >> 12) & 0x7;
      const rs1 = (instruction >> 15) & 0x1F;
      const rs2 = (instruction >> 20) & 0x1F;
      const funct7 = (instruction >> 25) & 0x7F;
      
      switch (funct3) {
        case 0x0: 
          if (funct7 === 0x00) {
            this.registers[rd] = this.registers[rs1] + this.registers[rs2];
          } else if (funct7 === 0x20) {
            this.registers[rd] = this.registers[rs1] - this.registers[rs2];
          }
          break;
          
        case 0x1: 
          this.registers[rd] = this.registers[rs1] << (this.registers[rs2] & 0x1F);
          break;
          
        case 0x2: 
          this.registers[rd] = (this.registers[rs1] < this.registers[rs2]) ? 1 : 0;
          break;
          
        case 0x3: 
          this.registers[rd] = ((this.registers[rs1] >>> 0) < (this.registers[rs2] >>> 0)) ? 1 : 0;
          break;
          
        case 0x4: 
          this.registers[rd] = this.registers[rs1] ^ this.registers[rs2];
          break;
          
        case 0x5: 
          if (funct7 === 0x00) {
            this.registers[rd] = this.registers[rs1] >>> (this.registers[rs2] & 0x1F);
          } else if (funct7 === 0x20) {
            this.registers[rd] = this.registers[rs1] >> (this.registers[rs2] & 0x1F);
          }
          break;
          
        case 0x6: 
          this.registers[rd] = this.registers[rs1] | this.registers[rs2];
          break;
          
        case 0x7: 
          this.registers[rd] = this.registers[rs1] & this.registers[rs2];
          break;
      }
    }
    
    
    else if (opcode === 0x13) {
      const rd = (instruction >> 7) & 0x1F;
      const funct3 = (instruction >> 12) & 0x7;
      const rs1 = (instruction >> 15) & 0x1F;
      const imm = ((instruction >> 20) << 20) >> 20; 
      
      switch (funct3) {
        case 0x0: 
          this.registers[rd] = this.registers[rs1] + imm;
          break;
          
        case 0x1: 
          this.registers[rd] = this.registers[rs1] << (imm & 0x1F);
          break;
          
        case 0x2: 
          this.registers[rd] = (this.registers[rs1] < imm) ? 1 : 0;
          break;
          
        case 0x3: 
          this.registers[rd] = ((this.registers[rs1] >>> 0) < (imm >>> 0)) ? 1 : 0;
          break;
          
        case 0x4: 
          this.registers[rd] = this.registers[rs1] ^ imm;
          break;
          
        case 0x5: 
          const shamt = imm & 0x1F;
          const funct7 = (imm >> 5) & 0x7F;
          
          if (funct7 === 0x00) {
            this.registers[rd] = this.registers[rs1] >>> shamt;
          } else if (funct7 === 0x20) {
            this.registers[rd] = this.registers[rs1] >> shamt;
          }
          break;
          
        case 0x6: 
          this.registers[rd] = this.registers[rs1] | imm;
          break;
          
        case 0x7: 
          this.registers[rd] = this.registers[rs1] & imm;
          break;
      }
    }
    
    
    else if (opcode === 0x03) {
      const rd = (instruction >> 7) & 0x1F;
      const funct3 = (instruction >> 12) & 0x7;
      const rs1 = (instruction >> 15) & 0x1F;
      const imm = ((instruction >> 20) << 20) >> 20; 
      
      const addr = this.registers[rs1] + imm;
      
      switch (funct3) {
        case 0x0: 
          this.registers[rd] = ((this.memory[addr] << 24) >> 24); 
          break;
          
        case 0x1: 
          this.registers[rd] = ((this.readHalfWord(addr) << 16) >> 16); 
          break;
          
        case 0x2: 
          this.registers[rd] = this.readWord(addr);
          break;
          
        case 0x4: 
          this.registers[rd] = this.memory[addr] & 0xFF;
          break;
          
        case 0x5: 
          this.registers[rd] = this.readHalfWord(addr) & 0xFFFF;
          break;
      }
    }
    
    
    else if (opcode === 0x23) {
      const funct3 = (instruction >> 12) & 0x7;
      const rs1 = (instruction >> 15) & 0x1F;
      const rs2 = (instruction >> 20) & 0x1F;
      
      
      const imm = (((instruction >> 25) & 0x7F) << 5) | ((instruction >> 7) & 0x1F);
      const signExtImm = ((imm << 20) >> 20); 
      
      const addr = this.registers[rs1] + signExtImm;
      
      switch (funct3) {
        case 0x0: 
          this.memory[addr] = this.registers[rs2] & 0xFF;
          break;
          
        case 0x1: 
          this.writeHalfWord(addr, this.registers[rs2] & 0xFFFF);
          break;
          
        case 0x2: 
          this.writeWord(addr, this.registers[rs2]);
          break;
      }
    }
    
    
    this.registers[0] = 0;
  }
  
  /**
   * Read a halfword from memory
   * @param {number} address - Memory address
   * @returns {number} 16-bit halfword
   */
  readHalfWord(address) {
    const byte0 = this.memory[address];
    const byte1 = this.memory[address + 1];
    
    return byte0 | (byte1 << 8);
  }
  
  /**
   * Write a halfword to memory
   * @param {number} address - Memory address
   * @param {number} value - 16-bit halfword
   */
  writeHalfWord(address, value) {
    this.memory[address] = value & 0xFF;
    this.memory[address + 1] = (value >> 8) & 0xFF;
  }
  
  /**
   * Append text to output
   * @param {string} text - Text to append
   */
  appendOutput(text) {
    this.output += text;
    if (this.outputCallback) {
      this.outputCallback(text);
    }
  }
  
  /**
   * Read a word from memory
   * @param {number} address - Memory address
   * @returns {number} 32-bit word
   */
  readWord(address) {
    const byte0 = this.memory[address];
    const byte1 = this.memory[address + 1];
    const byte2 = this.memory[address + 2];
    const byte3 = this.memory[address + 3];
    
    return byte0 | (byte1 << 8) | (byte2 << 16) | (byte3 << 24);
  }
  
  /**
   * Write a word to memory
   * @param {number} address - Memory address
   * @param {number} value - 32-bit word
   */
  writeWord(address, value) {
    this.memory[address] = value & 0xFF;
    this.memory[address + 1] = (value >> 8) & 0xFF;
    this.memory[address + 2] = (value >> 16) & 0xFF;
    this.memory[address + 3] = (value >> 24) & 0xFF;
  }
  
  /**
   * Get register value by name
   * @param {string} name - Register name (e.g., 'x1', 'ra')
   * @returns {number} Register value
   */
  getRegister(name) {
    
    let regNum = -1;
    
    if (name.startsWith('x')) {
      regNum = parseInt(name.substring(1), 10);
    } else {
      
      for (const [key, info] of Object.entries(REGISTERS)) {
        if (info.alias === name) {
          regNum = parseInt(key.substring(1), 10);
          break;
        }
      }
    }
    
    if (regNum < 0 || regNum >= 32) {
      throw new Error(`Invalid register: ${name}`);
    }
    
    return this.registers[regNum];
  }
  
  /**
   * Set register value by name
   * @param {string} name - Register name (e.g., 'x1', 'ra')
   * @param {number} value - Value to set
   */
  setRegister(name, value) {
    
    let regNum = -1;
    
    if (name.startsWith('x')) {
      regNum = parseInt(name.substring(1), 10);
    } else {
      
      for (const [key, info] of Object.entries(REGISTERS)) {
        if (info.alias === name) {
          regNum = parseInt(key.substring(1), 10);
          break;
        }
      }
    }
    
    if (regNum < 0 || regNum >= 32) {
      throw new Error(`Invalid register: ${name}`);
    }
    
    
    if (regNum !== 0) {
      this.registers[regNum] = value;
    }
  }
  
  /**
   * Get CPU state as a string
   * @returns {string} CPU state
   */
  getState() {
    let state = 'CPU State:\n';
    state += `PC: 0x${this.pc.toString(16).padStart(8, '0')}\n`;
    
    
    for (let i = 0; i < 32; i += 4) {
      state += `x${i.toString().padStart(2, '0')}: 0x${this.registers[i].toString(16).padStart(8, '0')}  `;
      state += `x${(i+1).toString().padStart(2, '0')}: 0x${this.registers[i+1].toString(16).padStart(8, '0')}  `;
      state += `x${(i+2).toString().padStart(2, '0')}: 0x${this.registers[i+2].toString(16).padStart(8, '0')}  `;
      state += `x${(i+3).toString().padStart(2, '0')}: 0x${this.registers[i+3].toString(16).padStart(8, '0')}\n`;
    }
    
    return state;
  }
}

/**
 * Run a RISC-V assembly program and return its output
 * @param {string} assembly - RISC-V assembly code
 * @param {Function} outputCallback - Optional callback for receiving output
 * @returns {string} Program output
 */
export const runRISCV = (assembly, outputCallback = null) => {
  const simulator = new RISCVSimulator();
  
  if (outputCallback) {
    simulator.setOutputCallback(outputCallback);
  }
  
  simulator.loadProgram(assembly);
  return simulator.run();
};

export default RISCVSimulator; 