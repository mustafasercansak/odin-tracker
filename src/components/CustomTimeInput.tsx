import React, { useState, useEffect } from 'react';

interface CustomTimeInputProps {
  label: string;
  value: string; // HH:mm format
  onChange: (value: string) => void;
  error?: string;
}

export const CustomTimeInput: React.FC<CustomTimeInputProps> = ({
  label,
  value,
  onChange,
  error
}) => {
  const [inputValue, setInputValue] = useState('');

  // Sync internal value to display value (HH:mm -> HH.mm)
  useEffect(() => {
    if (value) {
      setInputValue(value.replace(':', '.'));
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');
    
    // Auto-masking for HH.mm
    if (val.length > inputValue.length) { // Typing
      if (val.length === 2) {
        val += '.';
      }
    }
    
    if (val.length > 5) return;
    
    setInputValue(val);

    // If we have a full valid time, update the parent
    if (val.length === 5) {
      const [h, m] = val.split('.');
      const hours = parseInt(h);
      const mins = parseInt(m);
      
      if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60) {
        onChange(`${h}:${m}`);
      }
    } else if (val.length === 0) {
      onChange(''); // Allow clearing
    }
  };

  return (
    <div className="space-y-1.5 flex-1 sm:w-32 sm:flex-none">
      <label htmlFor={`time-input-${label}`} className="block text-sm font-semibold mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={`time-input-${label}`}
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder="HH.mm"
          className={`
            w-full px-4 py-2.5 rounded-xl bg-input border outline-none transition-all
            ${error ? 'border-destructive' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'}
          `}
        />
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
};
