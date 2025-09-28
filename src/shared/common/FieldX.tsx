type FieldXProps = {
  label: string;
  value?: string | number | null;
  placeholder?: string;
  /** Texto fijo a la izquierda, p.ej. "+ 51" para teléfono */
  prefix?: string;
  /** Para accesibilidad (opcional) */
  id?: string;
  className?: string;
};

export default function FieldX({
  label,
  value,
  placeholder = '',
  prefix,
  id,
  className = '',
}: FieldXProps) {
  const hasValue = value !== undefined && value !== null && String(value).trim() !== '';

  return (
    <div className={className}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>

      {prefix ? (
        <div className="flex items-stretch">
          <div className="px-3 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-200 rounded-l">
            {prefix}
          </div>
          <div
            id={id}
            className={[
              'flex-1 border border-gray-200 rounded-r px-3 py-2 text-sm',
              hasValue ? 'text-gray-800' : 'text-gray-400',
            ].join(' ')}
          >
            {hasValue ? String(value) : placeholder}
          </div>
        </div>
      ) : (
        <div
          id={id}
          className={[
            'border border-gray-200 rounded px-3 py-2 text-sm',
            hasValue ? 'text-gray-800' : 'text-gray-400',
          ].join(' ')}
        >
          {hasValue ? String(value) : placeholder}
        </div>
      )}
    </div>
  );
}
