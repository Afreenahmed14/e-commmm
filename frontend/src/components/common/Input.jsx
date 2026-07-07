import './Input.css';

/**
 * Controlled/uncontrolled text input designed to plug directly into
 * React Hook Form's `register()` spread, with built-in label + error display.
 */
export default function Input({ label, error, id, type = 'text', register, ...rest }) {
  const inputId = id || rest.name;
  return (
    <div className="form-field">
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <input
        id={inputId}
        type={type}
        className={`form-input ${error ? 'form-input-error' : ''}`}
        {...(register || {})}
        {...rest}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
