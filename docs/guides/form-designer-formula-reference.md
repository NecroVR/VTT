# Form Designer Formula Language Reference

## Table of Contents
1. [Overview](#overview)
2. [Syntax Basics](#syntax-basics)
3. [Property References](#property-references)
4. [Operators](#operators)
5. [Built-in Functions](#built-in-functions)
6. [Examples](#examples)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What are Computed Fields?

Computed fields allow you to define formulas that automatically calculate values from other fields in your form. These calculations happen in real-time as users update field values, making them perfect for derived statistics, modifiers, and totals.

### Use Cases

- **Ability Modifiers** - Calculate D&D ability modifiers from ability scores
- **Attack Bonuses** - Compute attack rolls from proficiency and ability modifiers
- **Encumbrance** - Calculate total weight from inventory items
- **Conditional Values** - Display different values based on character level or class
- **Resource Totals** - Sum up spell slots, hit dice, or other resources

### How Computed Fields Work

1. **Define** the computed field in the Form Settings panel with a unique ID and formula
2. **Add** a Computed Field component to your layout
3. **Configure** the display format and styling
4. **Use** - The field automatically updates when referenced properties change

---

## Syntax Basics

### Formula Structure

Formulas are expressions that combine:
- Property references (e.g., `strength`, `level`)
- Operators (e.g., `+`, `-`, `*`, `/`)
- Functions (e.g., `floor()`, `if()`, `sum()`)
- Literals (numbers, strings, booleans)

### Simple Example
```
floor((strength - 10) / 2)
```
This calculates a D&D 5e ability modifier from the strength score.

### Complex Example
```
if(level >= 5, proficiencyBonus + 2, proficiencyBonus) + dexterityModifier
```
This computes an attack bonus that increases at level 5.

### Whitespace

Whitespace is ignored in formulas, so these are equivalent:
```
floor((strength-10)/2)
floor( (strength - 10) / 2 )
```

### Comments

Formulas do not support comments. Keep formulas focused and document them in the computed field's description instead.

---

## Property References

### Dot Notation

Access nested properties using dot notation:
```
abilities.strength.value
character.level
proficiency.bonus
```

### Root Level Properties

Simple properties at the root level of your entity:
```
level
name
experience
gold
```

### Array Access

Access array elements by index (zero-based):
```
inventory[0].weight
spells[3].level
```

### Array Wildcards

Use `*` to reference all items in an array:
```
inventory.*.weight    (refers to all item weights)
skills.*.proficient   (refers to all skill proficiency flags)
```

Note: Wildcards are typically used with array functions like `sum()` or `count()`.

### Deep Nesting

You can access deeply nested properties:
```
character.class.features.rageBonus
equipment.armor.properties.acBonus
```

### Undefined Properties

If a property doesn't exist, it evaluates to `undefined`. In mathematical operations, `undefined` is treated as `0`.

---

## Operators

### Operator Precedence

Operators are evaluated in this order (highest to lowest):

1. Parentheses `()`
2. Unary operators `-`, `not`
3. Power `^`
4. Multiplication, Division, Modulo `*`, `/`, `%`
5. Addition, Subtraction `+`, `-`
6. Comparison `<`, `>`, `<=`, `>=`
7. Equality `==`, `!=`
8. Logical AND `and`
9. Logical OR `or`

### Mathematical Operators

#### Addition `+`
```
5 + 3           // 8
level + 2       // character level plus 2
```

#### Subtraction `-`
```
10 - 3          // 7
maxHP - damage  // remaining hit points
```

#### Multiplication `*`
```
2 * 3           // 6
level * 5       // 5 times character level
```

#### Division `/`
```
10 / 2          // 5
(strength - 10) / 2
```

**Note**: Division by zero throws an error.

#### Modulo `%`
```
10 % 3          // 1 (remainder)
experience % 100
```

#### Power `^`
```
2 ^ 3           // 8 (2 cubed)
base ^ exponent
```

### Comparison Operators

#### Equals `==`
```
level == 5              // true if level is exactly 5
class == "fighter"      // string comparison
```

#### Not Equals `!=`
```
level != 1              // true if not level 1
alignment != "evil"
```

#### Less Than `<`
```
level < 5               // true if level is less than 5
currentHP < maxHP / 2   // below half health
```

#### Greater Than `>`
```
level > 10              // true if level greater than 10
gold > 1000
```

#### Less Than or Equal `<=`
```
level <= 3
weight <= carryCapacity
```

#### Greater Than or Equal `>=`
```
level >= 5
strength >= 16
```

### Logical Operators

#### Logical AND `and`
```
level >= 5 and class == "fighter"
isProficient and hasAdvantage
```

Returns `true` only if both conditions are true.

#### Logical OR `or`
```
class == "fighter" or class == "paladin"
hasAdvantage or hasBless
```

Returns `true` if either condition is true.

#### Logical NOT `not`
```
not isProficient        // true if not proficient
not (level >= 5)        // true if level less than 5
```

Inverts a boolean value.

### Parentheses

Use parentheses to control evaluation order:
```
(strength - 10) / 2           // Subtract first, then divide
strength - (10 / 2)           // Divide first, then subtract (different result!)

(level >= 5) and (class == "fighter")  // Explicit grouping for clarity
```

---

## Built-in Functions

### Mathematical Functions

#### `floor(x)`
Rounds down to the nearest integer.
```
floor(3.7)              // 3
floor((strength - 10) / 2)  // Ability modifier calculation
floor(level / 2)        // Half level, rounded down
```

#### `ceil(x)`
Rounds up to the nearest integer.
```
ceil(3.2)               // 4
ceil(weight / 10)       // Encumbrance in 10-pound increments
```

#### `round(x)`
Rounds to the nearest integer.
```
round(3.5)              // 4
round(3.4)              // 3
round(averageDamage)
```

#### `abs(x)`
Returns the absolute value (always positive).
```
abs(-5)                 // 5
abs(x - y)              // Distance between x and y
```

#### `sqrt(x)`
Returns the square root.
```
sqrt(16)                // 4
sqrt(power)
```

#### `min(a, b, ...)`
Returns the smallest value from the arguments.
```
min(5, 3, 8)            // 3
min(strength, dexterity, constitution)
```

#### `max(a, b, ...)`
Returns the largest value from the arguments.
```
max(5, 3, 8)            // 8
max(baseAC, armorAC, shieldAC)
```

### Array Functions

#### `sum(array)`
Sums all numeric values in an array.
```
sum(inventory.*.weight)         // Total encumbrance
sum(damageRolls)                // Total damage
sum(spellSlots.*.used)          // Used spell slots
```

**Requirements**: Argument must be an array.

#### `count(array)`
Returns the number of items in an array.
```
count(inventory)                // Number of items
count(skills)                   // Number of skills
count(features)                 // Number of features
```

**Requirements**: Argument must be an array.

### Conditional Function

#### `if(condition, trueValue, falseValue)`
Returns `trueValue` if condition is true, otherwise returns `falseValue`.

```
if(level >= 5, 3, 2)                    // Proficiency bonus by level
if(isProficient, proficiencyBonus, 0)   // Add proficiency if proficient
if(strength > dexterity, strength, dexterity)  // Higher of two values
```

**Nested Conditionals**:
```
if(level >= 17, 6,
  if(level >= 13, 5,
    if(level >= 9, 4,
      if(level >= 5, 3, 2)
    )
  )
)
```

This calculates D&D 5e proficiency bonus by level.

---

## Examples

### D&D 5e Examples

#### Ability Modifier
Calculate ability modifier from ability score:
```
floor((strength - 10) / 2)
```

#### Proficiency Bonus by Level
```
if(level >= 17, 6,
  if(level >= 13, 5,
    if(level >= 9, 4,
      if(level >= 5, 3, 2)
    )
  )
)
```

Or using a simpler formula:
```
floor((level - 1) / 4) + 2
```

#### Attack Bonus
Melee attack with strength:
```
proficiencyBonus + floor((strength - 10) / 2)
```

Ranged attack with dexterity:
```
proficiencyBonus + floor((dexterity - 10) / 2)
```

#### Armor Class
Base AC with dexterity:
```
10 + floor((dexterity - 10) / 2)
```

Armor + Dex modifier (max 2):
```
armorBaseAC + min(floor((dexterity - 10) / 2), 2)
```

#### Spell Save DC
```
8 + proficiencyBonus + floor((spellcastingAbility - 10) / 2)
```

#### Initiative Modifier
```
floor((dexterity - 10) / 2)
```

#### Skill Modifier
```
floor((relatedAbility - 10) / 2) + if(isProficient, proficiencyBonus, 0)
```

With expertise:
```
floor((relatedAbility - 10) / 2) + if(hasExpertise, proficiencyBonus * 2, if(isProficient, proficiencyBonus, 0))
```

#### Encumbrance
Total weight carried:
```
sum(inventory.*.weight)
```

Encumbrance threshold:
```
strength * 15
```

Is encumbered:
```
sum(inventory.*.weight) > strength * 15
```

#### Spell Slots Used
```
sum(spellSlots.*.used)
```

#### Spell Slots Remaining
```
sum(spellSlots.*.max) - sum(spellSlots.*.used)
```

### General Examples

#### Percentage Calculation
```
(current / max) * 100
```

#### Average of Multiple Values
```
(value1 + value2 + value3) / 3
```

#### Conditional Bonus
Add bonus if condition is met:
```
baseValue + if(hasBonus, bonusAmount, 0)
```

#### Clamped Value
Keep value between min and max:
```
min(max(value, minValue), maxValue)
```

#### Distance Formula
```
sqrt((x2 - x1) ^ 2 + (y2 - y1) ^ 2)
```

---

## Best Practices

### Keep Formulas Simple

**Good**: Clear and focused
```
floor((strength - 10) / 2)
```

**Avoid**: Overly complex in a single formula
```
floor((strength - 10) / 2) + if(isProficient, if(level >= 5, 3, 2), 0) + if(hasMagicWeapon, magicBonus, 0)
```

Instead, break complex calculations into multiple computed fields:
```
strengthModifier = floor((strength - 10) / 2)
proficiencyBonus = if(level >= 5, 3, 2)
attackBonus = strengthModifier + proficiencyBonus + magicBonus
```

### Use Descriptive Field IDs

**Good**: Self-documenting
```
strengthModifier
proficiencyBonus
totalEncumbrance
```

**Avoid**: Cryptic abbreviations
```
strMod
pb
enc
```

### Document Your Formulas

Always fill in the computed field's **Description** to explain what it calculates and why.

### Validate Input Data

Remember that properties might be `undefined`. Use defaults:
```
(strength or 10)        // Default strength to 10 if undefined
```

Or validate with conditionals:
```
if(strength, floor((strength - 10) / 2), 0)
```

### Test Edge Cases

Test your formulas with:
- Minimum values (e.g., ability score of 1)
- Maximum values (e.g., level 20 character)
- Missing or undefined properties
- Zero values (especially for division)

### Performance Considerations

- Formulas are re-evaluated when dependencies change
- Avoid deeply nested formulas that reference many properties
- Use caching by keeping formulas simple and focused

### Avoid Circular Dependencies

**Don't do this**:
```
fieldA = fieldB + 1
fieldB = fieldA + 1
```

The engine will detect circular dependencies and throw an error.

---

## Troubleshooting

### Common Errors

#### "Division by zero"
**Cause**: Dividing by a value that equals zero.

**Fix**: Add a conditional check:
```
if(denominator == 0, 0, numerator / denominator)
```

#### "Cannot index non-array value"
**Cause**: Trying to use array access `[0]` on a non-array property.

**Fix**: Verify the property is actually an array in your data model.

#### "Unknown function: X"
**Cause**: Using a function that doesn't exist.

**Fix**: Check the function name spelling and refer to the Built-in Functions section.

#### "Expected )"
**Cause**: Missing closing parenthesis.

**Fix**: Count your parentheses. Every `(` needs a matching `)`.

#### "Unexpected character"
**Cause**: Invalid syntax, often a typo.

**Fix**: Review the formula for typos and check operator syntax.

### Formula Returns Unexpected Value

#### Check Property References
Verify that property names exactly match your entity data structure:
```
strength        // ✓ Root property
abilities.strength.value  // ✓ Nested property
```

#### Check Data Types
Make sure you're using the right operators for the data type:
```
level == "5"    // ✗ Comparing number to string
level == 5      // ✓ Correct comparison
```

#### Check Operator Precedence
Use parentheses to ensure correct evaluation order:
```
10 + 5 * 2      // 20 (multiplication first)
(10 + 5) * 2    // 30 (addition first)
```

### Formula Doesn't Update

#### Check Dependencies
The formula only re-evaluates when referenced properties change. If the formula doesn't update:
1. Verify property names are correct
2. Make sure the properties are actually changing
3. Check that the property is bound to a field (not static)

#### Clear Cache
Try saving the form and reloading to clear any cached values.

### Performance Issues

If formulas are slow:
1. **Simplify** - Break complex formulas into smaller ones
2. **Reduce array operations** - `sum(inventory.*.weight)` on 1000 items will be slow
3. **Check for infinite loops** - Avoid circular dependencies

---

## Advanced Topics

### Working with Arrays

#### Sum Specific Items
Use a temporary computed field with a conditional:
```
itemWeightIfHeavy = if(inventory.*.weight > 10, inventory.*.weight, 0)
heavyItemTotal = sum(itemWeightIfHeavy)
```

#### Count Matching Items
```
isProficientSkill = if(skills.*.proficient, 1, 0)
proficientSkillCount = sum(isProficientSkill)
```

### Type Coercion

The formula engine performs automatic type coercion:
- `undefined` → `0` in math operations
- Numbers → strings in string operations
- Any value → boolean in logical operations

Be explicit when needed:
```
if(value, value, 0)     // Convert undefined to 0
```

### Complex Conditionals

Use `and` and `or` for multiple conditions:
```
if((level >= 5 and class == "fighter") or hasFeat, bonusValue, 0)
```

### String Operations

Currently, the formula language is primarily designed for numeric calculations. String operations are limited to:
- Equality comparison `==`
- Inequality comparison `!=`

For display formatting, use the Computed Field component's **Format** option instead of trying to concatenate in the formula.

---

## Quick Reference Card

### Operators
| Operator | Description | Example |
|----------|-------------|---------|
| `+` | Addition | `5 + 3` |
| `-` | Subtraction | `10 - 3` |
| `*` | Multiplication | `2 * 3` |
| `/` | Division | `10 / 2` |
| `%` | Modulo | `10 % 3` |
| `^` | Power | `2 ^ 3` |
| `==` | Equals | `x == 5` |
| `!=` | Not equals | `x != 5` |
| `<` | Less than | `x < 5` |
| `>` | Greater than | `x > 5` |
| `<=` | Less/equal | `x <= 5` |
| `>=` | Greater/equal | `x >= 5` |
| `and` | Logical AND | `a and b` |
| `or` | Logical OR | `a or b` |
| `not` | Logical NOT | `not a` |

### Functions
| Function | Description | Example |
|----------|-------------|---------|
| `floor(x)` | Round down | `floor(3.7)` → `3` |
| `ceil(x)` | Round up | `ceil(3.2)` → `4` |
| `round(x)` | Round nearest | `round(3.5)` → `4` |
| `abs(x)` | Absolute value | `abs(-5)` → `5` |
| `sqrt(x)` | Square root | `sqrt(16)` → `4` |
| `min(...)` | Minimum | `min(5,3,8)` → `3` |
| `max(...)` | Maximum | `max(5,3,8)` → `8` |
| `sum(array)` | Sum array | `sum([1,2,3])` → `6` |
| `count(array)` | Count items | `count([1,2,3])` → `3` |
| `if(c,t,f)` | Conditional | `if(x>5,10,0)` |

### Common D&D 5e Formulas
```
Ability Modifier:       floor((ability - 10) / 2)
Proficiency Bonus:      floor((level - 1) / 4) + 2
Attack Bonus:           proficiencyBonus + abilityModifier
Spell Save DC:          8 + proficiencyBonus + abilityModifier
Armor Class:            10 + dexterityModifier
Skill Modifier:         abilityModifier + if(isProficient, proficiencyBonus, 0)
```

---

**Related Documentation:**
- [Form Designer User Guide](./form-designer-guide.md)
- [Field Types Reference](./field-types-reference.md)
- [Computed Field Engine Implementation](../../apps/web/src/lib/services/computedFieldEngine.ts)
