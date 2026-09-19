import { useId } from 'react';

/*
 * Form primitives. Every field owns its label, its required marker and its error, so a
 * validation message can never end up attached to the wrong input.
 */

export function Field({ label, required, error, hint, children, id }) {
  const generated = useId();
  const fieldId = id || generated;
  const errorId = `${fieldId}-error`;

  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <label htmlFor={fieldId}>
        {label}
        {required ? (
          <span className="req" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {typeof children === 'function'
        ? children({ id: fieldId, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? errorId : undefined })
        : children}
      {error ? (
        <span className="field__error" id={errorId}>
          {error}
        </span>
      ) : null}
      {!error && hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

/**
 * The amount input. Set large and monospaced with a fixed rupee prefix — it is the
 * number staff re-read before saving, so it gets the weight.
 */
export function AmountField({ label = 'Amount', required, error, value, onChange, id, ...rest }) {
  const generated = useId();
  const fieldId = id || generated;
  const errorId = `${fieldId}-error`;

  return (
    <div className={`field field--amount${error ? ' field--invalid' : ''}`}>
      <label htmlFor={fieldId}>
        {label}
        {required ? (
          <span className="req" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <span className="rupee" aria-hidden="true">
        &#8377;
      </span>
      <input
        id={fieldId}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error ? (
        <span className="field__error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

/**
 * A row of mutually exclusive choices — payment status, report grouping. Buttons
 * rather than a <select> because they are one tap on a phone and show the current
 * choice without opening anything.
 */
export function Segmented({ label, options, value, onChange, tone = false, ariaLabel }) {
  return (
    <div className="field">
      {/* a group of buttons has no single input to label, so this is text, not a <label> */}
      {label ? <span className="fieldlabel">{label}</span> : null}
      <div className={`seg${tone ? ' seg--money' : ''}`} role="group" aria-label={ariaLabel || label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            data-tone={tone ? option.value : undefined}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
