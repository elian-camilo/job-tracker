import { useState } from "react";

type Validators<T> = Partial<Record<keyof T, (value: unknown) => string | null>>;

export function useForm<T extends object>(initial: T) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  function setField<K extends keyof T>(key: K, value: T[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear error for the field when user edits
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function reset(next: T) {
    setValues(next);
    setErrors({});
  }

  function validate(validators: Validators<T>): Partial<Record<keyof T, string>> {
    const fieldErrors: Partial<Record<keyof T, string>> = {};
    for (const key in validators) {
      const validator = validators[key as keyof T];
      if (validator) {
        const error = validator(values[key as keyof T]);
        if (error) fieldErrors[key as keyof T] = error;
      }
    }
    setErrors(fieldErrors);
    return fieldErrors;
  }

  return { values, setField, reset, errors, validate };
}
