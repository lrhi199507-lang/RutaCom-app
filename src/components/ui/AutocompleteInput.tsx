import React, { useState, useRef, useEffect } from 'react';

export const AutocompleteInput = ({ label, icon: Icon, value, onChange, suggestions, placeholder }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  // Filtrar sugerencias basadas en lo que escribe el usuario
  const filtered = suggestions.filter(s => 
    s.toLowerCase().includes(value.toLowerCase())
  );

  // Cerrar la lista si el usuario hace clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Etiqueta superior */}
      <p className="text-[10px] font-black text-slate-400 uppercase mb-1 ml-1 tracking-wider">
        {label}
      </p>

      {/* Campo de Entrada */}
      <div className={`flex items-center bg-slate-50 border transition-all duration-200 rounded-2xl p-3 ${
        showSuggestions && value ? 'border-blue-200 shadow-sm' : 'border-slate-100'
      }`}>
        {Icon && <Icon size={16} className="text-slate-400 mr-2 shrink-0" />}
        <input 
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-700 placeholder:text-slate-300"
        />
      </div>
      
      {/* Lista de Sugerencias (Dropdown) */}
      {showSuggestions && value && filtered.length > 0 && (
        <div className="absolute z-[100] w-full bg-white mt-1 border border-slate-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {filtered.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full text-left p-3 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 border-b border-slate-50 last:border-none transition-colors"
              onClick={() => {
                onChange(suggestion);
                setShowSuggestions(false);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
