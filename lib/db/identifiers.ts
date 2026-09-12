const IDENTIFIER = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

export function requireIdentifier(value: unknown, name: string): string {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) {
    throw new Error(`${name} must be a valid identifier`);
  }
  return value;
}

export function requireShortText(
  value: unknown,
  name: string,
  maximum = 200,
): string {
  if (typeof value !== "string") {
    throw new Error(`${name} must be a string`);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum) {
    throw new Error(`${name} must be between 1 and ${maximum} characters`);
  }
  return normalized;
}
