import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';

interface CustomDateInputProps {
  value: string; // yyyy-mm-dd
  onChange: (value: string) => void;
  label: string;
  error?: string;
}

export const CustomDateInput: React.FC<CustomDateInputProps> = ({
  value,
  onChange,
  label,
  error,
}) => {
  const [inputValue, setInputValue] = useState('');

  // Sync internal value to display value
  useEffect(() => {
    if (value) {
      try {
        const date = parse(value, 'yyyy-MM-dd', new Date());
        if (isValid(date)) {
          setInputValue(format(date, 'dd.MM.yyyy'));
        }
      } catch (e) {
        setInputValue('');
      }
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Auto-masking for dd.MM.yyyy
    if (val.length > inputValue.length) { // Typing
      if (val.length === 2 || val.length === 5) {
        val += '.';
      }
    }
    
    if (val.length > 10) return;
    
    setInputValue(val);

    // If we have a full valid date, update the parent
    if (val.length === 10) {
      const parsed = parse(val, 'dd.MM.yyyy', new Date());
      if (isValid(parsed)) {
        onChange(format(parsed, 'yyyy-MM-dd'));
      }
    }
  };

  return (
    <div className="space-y-1.5 flex-1">
      <label htmlFor={`date-input-${label}`} className="block text-sm font-semibold mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={`date-input-${label}`}
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder="dd.mm.yyyy"
          className={`
            w-full px-4 py-2.5 rounded-xl bg-input border outline-none transition-all
            ${error ? 'border-destructive' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'}
          `}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
          <CalendarIcon size={18} />
        </div>
      </div>
      {error && <p className="text-xs text-destructive mt-1 font-medium">{error}</p>}
    </div>
  );
};
