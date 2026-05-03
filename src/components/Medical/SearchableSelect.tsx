import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Also check if clicked inside portal (which is harder without a ref to the portal content)
        const portalMenu = document.getElementById('searchable-select-portal');
        if (portalMenu && portalMenu.contains(event.target as Node)) return;
        
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMenuRect(rect);
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUp(spaceBelow < 300);
    }
    setIsOpen(!isOpen);
    if (!isOpen) setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative min-w-[160px] ${className}`}>
      <div
        onClick={toggleOpen}
        className="flex items-center justify-between px-3 py-2 bg-secondary/30 border border-border rounded-xl cursor-pointer hover:border-primary/50 transition-all group"
      >
        <span className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && menuRect && createPortal(
        <div 
          id="searchable-select-portal"
          className={`
            fixed z-[9999] w-64 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200
            ${openUp ? 'origin-bottom' : 'origin-top'}
          `}
          style={{
            left: menuRect.left,
            top: openUp ? menuRect.top - 8 : menuRect.bottom + 8,
            transform: openUp ? 'translateY(-100%)' : 'none'
          }}
        >
          <div className="p-3 border-b border-border bg-secondary/20">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search parameters..."
                className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No results found
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors
                    ${value === opt.value 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-foreground hover:bg-secondary'
                    }
                  `}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
