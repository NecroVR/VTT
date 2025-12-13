/**
 * Computed Field Engine for VTT Form Designer
 *
 * This module provides a sandboxed formula evaluation engine for computing
 * derived values in dynamic forms. It includes:
 * - Formula parsing into AST
 * - Dependency tracking
 * - Result caching with invalidation
 * - Safe, sandboxed execution
 */

import type { FormComputedField } from '@vtt/shared';

// ============================================================================
// AST Types
// ============================================================================

export type ASTNode =
  | { type: 'literal'; value: number | string | boolean }
  | { type: 'property'; path: string[] }
  | { type: 'binaryOp'; operator: string; left: ASTNode; right: ASTNode }
  | { type: 'unaryOp'; operator: string; operand: ASTNode }
  | { type: 'function'; name: string; args: ASTNode[] }
  | { type: 'arrayAccess'; array: ASTNode; index: ASTNode }
  | { type: 'conditional'; condition: ASTNode; trueBranch: ASTNode; falseBranch: ASTNode };

// ============================================================================
// Parser
// ============================================================================

class FormulaParser {
  private input: string;
  private position: number;
  private currentChar: string | null;

  constructor(formula: string) {
    this.input = formula;
    this.position = 0;
    this.currentChar = formula.length > 0 ? formula[0] : null;
  }

  /**
   * Parse the formula into an AST
   */
  parse(): ASTNode {
    return this.parseExpression();
  }

  private advance(): void {
    this.position++;
    this.currentChar = this.position < this.input.length ? this.input[this.position] : null;
  }

  private skipWhitespace(): void {
    while (this.currentChar !== null && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  private peek(offset: number = 1): string | null {
    const pos = this.position + offset;
    return pos < this.input.length ? this.input[pos] : null;
  }

  /**
   * Parse expression with operator precedence
   */
  private parseExpression(): ASTNode {
    return this.parseLogicalOr();
  }

  /**
   * Logical OR (lowest precedence)
   */
  private parseLogicalOr(): ASTNode {
    let node = this.parseLogicalAnd();

    while (this.currentChar !== null) {
      this.skipWhitespace();
      if (this.matchKeyword('or')) {
        this.consumeKeyword('or');
        const right = this.parseLogicalAnd();
        node = { type: 'binaryOp', operator: 'or', left: node, right };
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * Logical AND
   */
  private parseLogicalAnd(): ASTNode {
    let node = this.parseComparison();

    while (this.currentChar !== null) {
      this.skipWhitespace();
      if (this.matchKeyword('and')) {
        this.consumeKeyword('and');
        const right = this.parseComparison();
        node = { type: 'binaryOp', operator: 'and', left: node, right };
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * Comparison operators
   */
  private parseComparison(): ASTNode {
    let node = this.parseAdditive();

    while (this.currentChar !== null) {
      this.skipWhitespace();
      const operator = this.tryParseOperator(['==', '!=', '<=', '>=', '<', '>']);
      if (operator) {
        const right = this.parseAdditive();
        node = { type: 'binaryOp', operator, left: node, right };
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * Addition and subtraction
   */
  private parseAdditive(): ASTNode {
    let node = this.parseMultiplicative();

    while (this.currentChar !== null) {
      this.skipWhitespace();
      if (this.currentChar === '+' || this.currentChar === '-') {
        const operator = this.currentChar;
        this.advance();
        const right = this.parseMultiplicative();
        node = { type: 'binaryOp', operator, left: node, right };
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * Multiplication, division, and modulo
   */
  private parseMultiplicative(): ASTNode {
    let node = this.parsePower();

    while (this.currentChar !== null) {
      this.skipWhitespace();
      if (this.currentChar === '*' || this.currentChar === '/' || this.currentChar === '%') {
        const operator = this.currentChar;
        this.advance();
        const right = this.parsePower();
        node = { type: 'binaryOp', operator, left: node, right };
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * Power operator
   */
  private parsePower(): ASTNode {
    let node = this.parseUnary();

    while (this.currentChar !== null) {
      this.skipWhitespace();
      if (this.currentChar === '^') {
        this.advance();
        const right = this.parseUnary();
        node = { type: 'binaryOp', operator: '^', left: node, right };
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * Unary operators (-, not)
   */
  private parseUnary(): ASTNode {
    this.skipWhitespace();

    if (this.currentChar === '-') {
      this.advance();
      return { type: 'unaryOp', operator: '-', operand: this.parseUnary() };
    }

    if (this.matchKeyword('not')) {
      this.consumeKeyword('not');
      return { type: 'unaryOp', operator: 'not', operand: this.parseUnary() };
    }

    return this.parsePostfix();
  }

  /**
   * Postfix operations (array access, property access)
   */
  private parsePostfix(): ASTNode {
    let node = this.parsePrimary();

    while (this.currentChar !== null) {
      this.skipWhitespace();

      // Array access: expr[index]
      if (this.currentChar === '[') {
        this.advance();
        const index = this.parseExpression();
        this.skipWhitespace();
        if (this.currentChar !== ']') {
          throw new Error('Expected ]');
        }
        this.advance();
        node = { type: 'arrayAccess', array: node, index };
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * Primary expressions (literals, identifiers, function calls, parentheses)
   */
  private parsePrimary(): ASTNode {
    this.skipWhitespace();

    // Parentheses
    if (this.currentChar === '(') {
      this.advance();
      const node = this.parseExpression();
      this.skipWhitespace();
      if (this.currentChar !== ')') {
        throw new Error('Expected )');
      }
      this.advance();
      return node;
    }

    // Number literals
    if (this.currentChar !== null && /\d/.test(this.currentChar)) {
      return this.parseNumber();
    }

    // String literals
    if (this.currentChar === '"' || this.currentChar === "'") {
      return this.parseString();
    }

    // Boolean literals
    if (this.matchKeyword('true')) {
      this.consumeKeyword('true');
      return { type: 'literal', value: true };
    }
    if (this.matchKeyword('false')) {
      this.consumeKeyword('false');
      return { type: 'literal', value: false };
    }

    // Identifiers (property paths or function calls)
    if (this.currentChar !== null && /[a-zA-Z_]/.test(this.currentChar)) {
      return this.parseIdentifier();
    }

    throw new Error(`Unexpected character: ${this.currentChar}`);
  }

  /**
   * Parse number literal
   */
  private parseNumber(): ASTNode {
    let numStr = '';
    while (this.currentChar !== null && /[\d.]/.test(this.currentChar)) {
      numStr += this.currentChar;
      this.advance();
    }
    return { type: 'literal', value: parseFloat(numStr) };
  }

  /**
   * Parse string literal
   */
  private parseString(): ASTNode {
    const quote = this.currentChar;
    this.advance(); // Skip opening quote
    let str = '';
    while (this.currentChar !== null && this.currentChar !== quote) {
      if (this.currentChar === '\\' && this.peek() === quote) {
        this.advance(); // Skip backslash
        str += this.currentChar;
        this.advance();
      } else {
        str += this.currentChar;
        this.advance();
      }
    }
    if (this.currentChar !== quote) {
      throw new Error('Unterminated string');
    }
    this.advance(); // Skip closing quote
    return { type: 'literal', value: str };
  }

  /**
   * Parse identifier (property path or function call)
   */
  private parseIdentifier(): ASTNode {
    const name = this.parseIdentifierName();

    this.skipWhitespace();

    // Function call
    if (this.currentChar === '(') {
      this.advance();
      const args: ASTNode[] = [];

      this.skipWhitespace();
      if (this.currentChar !== ')') {
        args.push(this.parseExpression());
        this.skipWhitespace();

        while (this.currentChar === ',') {
          this.advance();
          args.push(this.parseExpression());
          this.skipWhitespace();
        }
      }

      if (this.currentChar !== ')') {
        throw new Error('Expected )');
      }
      this.advance();

      return { type: 'function', name, args };
    }

    // Property path (may have dots)
    const path = [name];
    while (this.currentChar === '.') {
      this.advance();
      path.push(this.parseIdentifierName());
    }

    return { type: 'property', path };
  }

  /**
   * Parse a single identifier name
   */
  private parseIdentifierName(): string {
    let name = '';
    while (this.currentChar !== null && /[a-zA-Z0-9_]/.test(this.currentChar)) {
      name += this.currentChar;
      this.advance();
    }
    return name;
  }

  /**
   * Check if current position matches a keyword
   */
  private matchKeyword(keyword: string): boolean {
    const remaining = this.input.substring(this.position);
    if (remaining.startsWith(keyword)) {
      const nextChar = this.input[this.position + keyword.length];
      // Make sure it's not part of a larger identifier
      return nextChar === undefined || !/[a-zA-Z0-9_]/.test(nextChar);
    }
    return false;
  }

  /**
   * Consume a keyword
   */
  private consumeKeyword(keyword: string): void {
    for (let i = 0; i < keyword.length; i++) {
      this.advance();
    }
  }

  /**
   * Try to parse one of several operators
   */
  private tryParseOperator(operators: string[]): string | null {
    this.skipWhitespace();
    for (const op of operators) {
      const remaining = this.input.substring(this.position);
      if (remaining.startsWith(op)) {
        for (let i = 0; i < op.length; i++) {
          this.advance();
        }
        return op;
      }
    }
    return null;
  }
}

// ============================================================================
// Evaluator
// ============================================================================

class FormulaEvaluator {
  private context: Record<string, unknown>;
  private timeout: number;
  private startTime: number;

  constructor(context: Record<string, unknown>, timeout: number = 1000) {
    this.context = context;
    this.timeout = timeout;
    this.startTime = Date.now();
  }

  /**
   * Evaluate an AST node
   */
  evaluate(node: ASTNode): unknown {
    // Check timeout
    if (Date.now() - this.startTime > this.timeout) {
      throw new Error('Formula evaluation timeout');
    }

    switch (node.type) {
      case 'literal':
        return node.value;

      case 'property':
        return this.getPropertyValue(node.path);

      case 'binaryOp':
        return this.evaluateBinaryOp(node.operator, node.left, node.right);

      case 'unaryOp':
        return this.evaluateUnaryOp(node.operator, node.operand);

      case 'function':
        return this.evaluateFunction(node.name, node.args);

      case 'arrayAccess':
        return this.evaluateArrayAccess(node.array, node.index);

      case 'conditional':
        return this.evaluateConditional(node.condition, node.trueBranch, node.falseBranch);

      default:
        throw new Error(`Unknown node type: ${(node as any).type}`);
    }
  }

  private getPropertyValue(path: string[]): unknown {
    let value: any = this.context;
    for (const key of path) {
      if (value == null) return undefined;
      value = value[key];
    }
    return value;
  }

  private evaluateBinaryOp(operator: string, left: ASTNode, right: ASTNode): unknown {
    const leftValue = this.evaluate(left);
    const rightValue = this.evaluate(right);

    switch (operator) {
      case '+':
        return (leftValue as number) + (rightValue as number);
      case '-':
        return (leftValue as number) - (rightValue as number);
      case '*':
        return (leftValue as number) * (rightValue as number);
      case '/':
        if ((rightValue as number) === 0) throw new Error('Division by zero');
        return (leftValue as number) / (rightValue as number);
      case '%':
        return (leftValue as number) % (rightValue as number);
      case '^':
        return Math.pow(leftValue as number, rightValue as number);
      case '==':
        return leftValue === rightValue;
      case '!=':
        return leftValue !== rightValue;
      case '<':
        return (leftValue as number) < (rightValue as number);
      case '>':
        return (leftValue as number) > (rightValue as number);
      case '<=':
        return (leftValue as number) <= (rightValue as number);
      case '>=':
        return (leftValue as number) >= (rightValue as number);
      case 'and':
        return leftValue && rightValue;
      case 'or':
        return leftValue || rightValue;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  private evaluateUnaryOp(operator: string, operand: ASTNode): unknown {
    const value = this.evaluate(operand);

    switch (operator) {
      case '-':
        return -(value as number);
      case 'not':
        return !value;
      default:
        throw new Error(`Unknown unary operator: ${operator}`);
    }
  }

  private evaluateFunction(name: string, args: ASTNode[]): unknown {
    const evaluatedArgs = args.map(arg => this.evaluate(arg));

    switch (name) {
      case 'floor':
        return Math.floor(evaluatedArgs[0] as number);
      case 'ceil':
        return Math.ceil(evaluatedArgs[0] as number);
      case 'round':
        return Math.round(evaluatedArgs[0] as number);
      case 'abs':
        return Math.abs(evaluatedArgs[0] as number);
      case 'sqrt':
        return Math.sqrt(evaluatedArgs[0] as number);
      case 'min':
        return Math.min(...(evaluatedArgs as number[]));
      case 'max':
        return Math.max(...(evaluatedArgs as number[]));
      case 'sum':
        if (!Array.isArray(evaluatedArgs[0])) {
          throw new Error('sum() requires an array');
        }
        return (evaluatedArgs[0] as number[]).reduce((a, b) => a + b, 0);
      case 'count':
        if (!Array.isArray(evaluatedArgs[0])) {
          throw new Error('count() requires an array');
        }
        return (evaluatedArgs[0] as unknown[]).length;
      case 'if':
        return evaluatedArgs[0] ? evaluatedArgs[1] : evaluatedArgs[2];
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }

  private evaluateArrayAccess(array: ASTNode, index: ASTNode): unknown {
    const arrayValue = this.evaluate(array);
    const indexValue = this.evaluate(index);

    if (!Array.isArray(arrayValue)) {
      throw new Error('Cannot index non-array value');
    }

    return arrayValue[indexValue as number];
  }

  private evaluateConditional(condition: ASTNode, trueBranch: ASTNode, falseBranch: ASTNode): unknown {
    const conditionValue = this.evaluate(condition);
    return conditionValue ? this.evaluate(trueBranch) : this.evaluate(falseBranch);
  }
}

// ============================================================================
// Dependency Tracker
// ============================================================================

class DependencyTracker {
  /**
   * Extract all property dependencies from an AST
   */
  static extractDependencies(node: ASTNode): string[] {
    const dependencies = new Set<string>();
    this.traverse(node, dependencies);
    return Array.from(dependencies);
  }

  private static traverse(node: ASTNode, dependencies: Set<string>): void {
    switch (node.type) {
      case 'property':
        dependencies.add(node.path.join('.'));
        break;

      case 'binaryOp':
        this.traverse(node.left, dependencies);
        this.traverse(node.right, dependencies);
        break;

      case 'unaryOp':
        this.traverse(node.operand, dependencies);
        break;

      case 'function':
        node.args.forEach(arg => this.traverse(arg, dependencies));
        break;

      case 'arrayAccess':
        this.traverse(node.array, dependencies);
        this.traverse(node.index, dependencies);
        break;

      case 'conditional':
        this.traverse(node.condition, dependencies);
        this.traverse(node.trueBranch, dependencies);
        this.traverse(node.falseBranch, dependencies);
        break;

      case 'literal':
        // No dependencies
        break;
    }
  }
}

// ============================================================================
// Computed Field Engine
// ============================================================================

interface CachedResult {
  value: unknown;
  dependencies: string[];
  timestamp: number;
}

export class ComputedFieldEngine {
  private cache: Map<string, CachedResult> = new Map();
  private parsedFormulas: Map<string, ASTNode> = new Map();

  /**
   * Parse a formula and cache the AST
   */
  parseFormula(fieldId: string, formula: string): void {
    try {
      const parser = new FormulaParser(formula);
      const ast = parser.parse();
      this.parsedFormulas.set(fieldId, ast);
    } catch (error) {
      throw new Error(`Failed to parse formula for ${fieldId}: ${(error as Error).message}`);
    }
  }

  /**
   * Evaluate a computed field
   */
  evaluate(
    field: FormComputedField,
    context: Record<string, unknown>,
    skipCache: boolean = false
  ): unknown {
    // Check cache
    if (!skipCache) {
      const cached = this.cache.get(field.id);
      if (cached && this.isCacheValid(cached, context)) {
        return cached.value;
      }
    }

    // Parse formula if not already parsed
    if (!this.parsedFormulas.has(field.id)) {
      this.parseFormula(field.id, field.formula);
    }

    const ast = this.parsedFormulas.get(field.id)!;

    // Evaluate
    const evaluator = new FormulaEvaluator(context);
    const value = evaluator.evaluate(ast);

    // Extract dependencies and cache result
    const dependencies = DependencyTracker.extractDependencies(ast);
    this.cache.set(field.id, {
      value,
      dependencies,
      timestamp: Date.now()
    });

    return value;
  }

  /**
   * Invalidate cache for a specific field
   */
  invalidate(fieldId: string): void {
    this.cache.delete(fieldId);
  }

  /**
   * Invalidate all cached results that depend on a changed property
   */
  invalidateDependents(changedPath: string): void {
    for (const [fieldId, cached] of this.cache.entries()) {
      if (cached.dependencies.some(dep => this.pathMatches(dep, changedPath))) {
        this.cache.delete(fieldId);
      }
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Check if cached result is still valid
   */
  private isCacheValid(cached: CachedResult, context: Record<string, unknown>): boolean {
    // Cache is valid if all dependencies still have the same values
    // For simplicity, we just return true here - invalidation is handled explicitly
    return true;
  }

  /**
   * Check if a dependency path matches a changed path
   */
  private pathMatches(dependency: string, changedPath: string): boolean {
    // Exact match
    if (dependency === changedPath) return true;

    // Dependency is a parent of changed path
    if (changedPath.startsWith(dependency + '.')) return true;

    // Dependency contains wildcards (e.g., inventory.*.weight)
    if (dependency.includes('*')) {
      const pattern = dependency.replace(/\*/g, '[^.]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(changedPath);
    }

    return false;
  }

  /**
   * Get all dependencies for a field
   */
  getDependencies(fieldId: string): string[] {
    const cached = this.cache.get(fieldId);
    if (cached) {
      return cached.dependencies;
    }

    const ast = this.parsedFormulas.get(fieldId);
    if (ast) {
      return DependencyTracker.extractDependencies(ast);
    }

    return [];
  }

  /**
   * Validate a formula (syntax check)
   */
  validateFormula(formula: string): { valid: boolean; error?: string } {
    try {
      const parser = new FormulaParser(formula);
      parser.parse();
      return { valid: true };
    } catch (error) {
      return { valid: false, error: (error as Error).message };
    }
  }
}

// Export singleton instance
export const computedFieldEngine = new ComputedFieldEngine();
