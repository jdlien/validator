# Validator v2.0.0 - Remaining Work

**Date:** 2026-01-24
**Current Version:** 2.0.0

---

## Remaining Features

| Feature | Impact | Complexity | Notes |
|---------|--------|------------|-------|
| **Programmatic single-input validation** | Medium | Low | `validateSingle(input)` method for validating individual inputs on demand. |

---

## Implementation Notes

### Programmatic Single-Input Validation

Expose a public method to validate a single input programmatically:

```typescript
public async validateSingle(input: FormControl): Promise<boolean> {
  if (!this.inputs.includes(input)) return true

  this.clearInputErrors(input)

  let valid = true
  valid = this.validateRequired(input) && valid
  valid = this.validateLength(input) && valid
  valid = this.validateValue(input) && valid
  valid = (await this.validateInput(input)) && valid
  if (!input.value.length) valid = (await this.validateCustom(input)) && valid

  this.showInputErrors(input)
  return valid
}
```

---

## Nice to Have (Future Consideration)

| Feature | Notes |
|---------|-------|
| File input validation | Validate file size, MIME type, extension |
| Accessible live region announcements | Better screen reader support |
| Built-in async validator debouncing | For expensive validation operations |
| Conditional validation | Skip validation based on other field values |
