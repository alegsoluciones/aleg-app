import React, { useState, useEffect } from 'react';

interface EditableFieldProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
  validation?: 'text' | 'name' | 'title';
  onCancel?: () => void;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  value, onSave, className, multiline, placeholder, maxLength, validation = 'text', onCancel
}) => {
  const [text, setText] = useState(value);

  useEffect(() => { setText(value); }, [value]);

  const handleBlur = () => {
    if (text !== value) {
      onSave(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // 👇 ESCAPE: Cancela y limpia el foco
    if (e.key === 'Escape') {
      e.preventDefault();
      setText(value);
      if (onCancel) onCancel();
      e.currentTarget.blur();
      return;
    }

    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (maxLength && val.length > maxLength) return;

    let isValid = false;
    if (validation === 'name') {
      isValid = /^[a-zA-Z\u00C0-\u00FF\s\.\-',\n]*$/.test(val);
    } else if (validation === 'title') {
      isValid = /^[a-zA-Z\u00C0-\u00FF\s\.\-',]*$/.test(val);
    } else {
      isValid = /^[^<>{}\\]*$/.test(val);
    }

    if (isValid || val === '') {
      setText(val);
    }
  };

  const baseClasses = `bg-transparent focus:outline-none transition-colors w-full border-b border-transparent hover:border-blue-200 focus:border-blue-500 placeholder-slate-300 ${className}`;

  return (
    <div className="relative w-full group">
      {multiline ? (
        <textarea
          className={`${baseClasses} resize-none overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent min-h-[100px] p-3 bg-slate-50 rounded-xl border border-slate-100 focus:bg-white`}
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Use comas o Enter para separar ítems..."}
        />
      ) : (
        <input
          type="text"
          className={baseClasses}
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      )}

      {maxLength && (
        <div className={`absolute bottom-2 right-3 text-[9px] font-mono pointer-events-none transition-colors z-10
              ${text.length > maxLength * 0.9 ? 'text-red-500 font-bold' : 'text-slate-300 opacity-0 group-focus-within:opacity-100'}`}>
          {text.length}/{maxLength}
        </div>
      )}
    </div>
  );
};