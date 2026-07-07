import { InputGroup, Label, TextField } from "@heroui/react";

export function DatetimeInput({
  label,
  value,
  onChange,
  isRequired,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
}) {
  return (
    <TextField isRequired={isRequired}>
      <Label>{label}</Label>
      <InputGroup>
        <InputGroup.Input
          className="scheme-light dark:scheme-dark"
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </InputGroup>
    </TextField>
  );
}
