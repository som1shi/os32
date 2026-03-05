export const JS_KEYWORDS = Object.freeze([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for',
  'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'null', 'of',
  'return', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try',
  'typeof', 'undefined', 'var', 'void', 'while', 'with', 'yield', 'async', 'await',
]);

export const C_KEYWORDS = Object.freeze([
  'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
  'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline',
  'int', 'long', 'register', 'restrict', 'return', 'short', 'signed', 'sizeof',
  'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void',
  'volatile', 'while', 'NULL', 'true', 'false',
]);

export const CPP_KEYWORDS = Object.freeze([
  ...C_KEYWORDS,
  'alignas', 'alignof', 'and', 'and_eq', 'asm', 'bitand', 'bitor', 'bool',
  'catch', 'class', 'compl', 'concept', 'consteval', 'constexpr', 'const_cast',
  'co_await', 'co_return', 'co_yield', 'decltype', 'delete', 'dynamic_cast',
  'explicit', 'export', 'friend', 'mutable', 'namespace', 'new', 'noexcept',
  'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'override',
  'private', 'protected', 'public', 'reinterpret_cast', 'requires',
  'static_assert', 'static_cast', 'template', 'this', 'thread_local', 'throw',
  'typeid', 'typename', 'using', 'virtual', 'xor', 'xor_eq',
  // Common stdlib identifiers
  'std', 'string', 'vector', 'map', 'set', 'pair', 'cout', 'cin', 'cerr', 'endl',
]);
