import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  children,
  className = "",
  icon: Icon,
  type = "button",
  variant = "secondary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant} ${className}`.trim()}
      type={type}
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" size={16} strokeWidth={2.2} /> : null}
      <span>{children}</span>
    </button>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  variant?: "secondary" | "ghost";
};

export function IconButton({
  className = "",
  icon: Icon,
  label,
  type = "button",
  variant = "ghost",
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`icon-button icon-button--${variant} ${className}`.trim()}
      title={label}
      type={type}
      {...props}
    >
      <Icon aria-hidden="true" size={17} strokeWidth={2.2} />
    </button>
  );
}

type FieldShellProps = {
  children: ReactNode;
  hint?: ReactNode;
  label: string;
};

function FieldShell({ children, hint, label }: FieldShellProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

type SelectFieldProps = {
  disabled?: boolean;
  hint?: ReactNode;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
};

export function SelectField({
  disabled,
  hint,
  label,
  onChange,
  options,
  value,
}: SelectFieldProps) {
  return (
    <FieldShell hint={hint} label={label}>
      <select
        className="control control--select"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

type InputFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> & {
  hint?: ReactNode;
  label: string;
  onChange: (value: string) => void;
};

export function InputField({
  className = "",
  hint,
  label,
  onChange,
  ...props
}: InputFieldProps) {
  return (
    <FieldShell hint={hint} label={label}>
      <input
        className={`control ${className}`.trim()}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </FieldShell>
  );
}

type SliderFieldProps = {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
};

export function SliderField({
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
}: SliderFieldProps) {
  return (
    <label className="field">
      <span className="field__label-row">
        <span className="field__label">{label}</span>
        <span className="field__value">{value}</span>
      </span>
      <input
        className="slider"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

type ToggleProps = {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

export function Toggle({ checked, label, onChange }: ToggleProps) {
  return (
    <label className="toggle">
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className="toggle__track" aria-hidden="true" />
      <span className="toggle__label">{label}</span>
    </label>
  );
}

type SegmentedControlProps = {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
};

export function SegmentedControl({
  label,
  onChange,
  options,
  value,
}: SegmentedControlProps) {
  return (
    <fieldset className="segmented-control">
      <legend>{label}</legend>
      <div className="segmented-control__options">
        {options.map((option) => (
          <button
            aria-pressed={option.value === value}
            className="segmented-control__button"
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

type ColorSwatchProps = {
  color: string;
  label: string;
  selected?: boolean;
};

export function ColorSwatch({ color, label, selected }: ColorSwatchProps) {
  return (
    <span
      aria-label={label}
      className={`color-swatch ${selected ? "is-selected" : ""}`.trim()}
      role="img"
      style={{ backgroundColor: color }}
      title={label}
    />
  );
}

type PanelHeaderProps = {
  actions?: ReactNode;
  eyebrow?: string;
  title: string;
};

export function PanelHeader({ actions, eyebrow, title }: PanelHeaderProps) {
  return (
    <header className="panel-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {actions ? <div className="panel-header__actions">{actions}</div> : null}
    </header>
  );
}

type StatusBadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${tone}`}>{children}</span>
  );
}
