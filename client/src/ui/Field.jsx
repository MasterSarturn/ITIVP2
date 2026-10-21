import { useId } from 'react'

// Подпись, поле и подсказка; контрол получает id через render-prop
export default function Field({ label, hint, className = '', children }) {
  const id = useId()
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  )
}

export function TextField({ label, hint, className, multiline, mono, ...props }) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => multiline
        ? <textarea id={id} className="textarea" {...props} />
        : <input id={id} className={`input ${mono ? 'mono-input' : ''}`} {...props} />}
    </Field>
  )
}

export function SelectField({ label, hint, className, options, placeholder, ...props }) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <select id={id} className="select" {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}
    </Field>
  )
}
