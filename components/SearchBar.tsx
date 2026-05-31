"use client";

import { useState, useRef, useEffect } from "react";

export interface SearchSuggestion {
  type: "destination" | "tour";
  label: string;
  sublabel?: string;
  count?: number;
  badges?: string[];
}

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  onQueryChange?: (value: string) => void;
  onSelectSuggestion?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  variant?: "glass" | "default";
  initialValue?: string;
}

export default function SearchBar({
  placeholder = "Bạn muốn đi đâu?",
  onSearch,
  onQueryChange,
  onSelectSuggestion,
  suggestions = [],
  variant = "glass",
  initialValue = "",
}: SearchBarProps) {
  const [searchValue, setSearchValue] = useState(initialValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync initialValue nếu được cập nhật từ bên ngoài
  useEffect(() => {
    if (initialValue) setSearchValue(initialValue);
  }, [initialValue]);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setSearchValue(value);
    onQueryChange?.(value);
    setShowDropdown(true);
  };

  const handleSearch = () => {
    onSearch?.(searchValue);
    setShowDropdown(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") setShowDropdown(false);
  };

  const handleSelect = (suggestion: SearchSuggestion) => {
    setSearchValue(suggestion.label);
    onSelectSuggestion?.(suggestion);
    onSearch?.(suggestion.label);
    setShowDropdown(false);
  };

  const hasSuggestions = showDropdown && suggestions.length > 0;
  const destinations = suggestions.filter((s) => s.type === "destination");
  const tours = suggestions.filter((s) => s.type === "tour");

  const inputClasses =
    "flex-1 px-8 py-4 rounded-[1.5rem] bg-white text-slate-900 placeholder-slate-400 focus:outline-none text-sm";
  const btnClasses =
    "px-10 py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-[1.5rem] transition-all active:scale-95 shadow-lg shadow-sky-600/20 text-sm whitespace-nowrap";

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      {/* Search Input Row */}
      <div
        className={`p-2 backdrop-blur-md flex flex-col md:flex-row gap-2 transition-all duration-200 ${variant === "glass"
          ? "bg-white/10 border border-white/20 shadow-2xl " +
          (hasSuggestions ? "rounded-t-[2rem] rounded-b-none border-b-white/5" : "rounded-[2rem]")
          : "bg-white/10 border border-white/20 shadow-2xl " +
          (hasSuggestions ? "rounded-t-[2rem] rounded-b-none" : "rounded-[2rem]")
          }`}
      >
        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onKeyDown={handleKeyPress}
          className={inputClasses}
        />
        <button onClick={handleSearch} className={btnClasses}>
          Tìm kiếm ngay
        </button>
      </div>

      {/* Dropdown Suggestions */}
      {hasSuggestions && (
        <div className="absolute left-0 right-0 z-50 bg-white border border-slate-100 border-t-0 rounded-b-[2rem] shadow-2xl overflow-hidden">
          <div className="max-h-[420px] overflow-y-auto py-2">

            {/* Destinations */}
            {destinations.length > 0 && (
              <div>
                {destinations.map((s, i) => (
                  <button
                    key={`dest-${i}`}
                    onMouseDown={() => handleSelect(s)}
                    className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors group text-left gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Location icon */}
                      <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 group-hover:bg-sky-100 transition-colors">
                        <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                      <span
                        className="text-sm text-slate-700 font-medium truncate"
                        dangerouslySetInnerHTML={{ __html: s.label }}
                      />
                    </div>
                    {s.count !== undefined && (
                      <span className="flex-shrink-0 text-xs font-bold text-slate-400">
                        {s.count} tour{s.count > 1 ? "s" : ""}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Divider */}
            {destinations.length > 0 && tours.length > 0 && (
              <div className="mx-6 my-1 border-t border-slate-100" />
            )}

            {/* Tour names */}
            {tours.length > 0 && (
              <div>
                {tours.map((s, i) => (
                  <button
                    key={`tour-${i}`}
                    onMouseDown={() => handleSelect(s)}
                    className="w-full flex items-start justify-between px-6 py-3 hover:bg-slate-50 transition-colors group text-left gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Tour icon */}
                      <span className="flex-shrink-0 w-7 h-7 mt-0.5 flex items-center justify-center rounded-full bg-slate-100 group-hover:bg-orange-50 transition-colors">
                        <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p
                          className="text-sm text-slate-700 font-medium leading-snug"
                          dangerouslySetInnerHTML={{ __html: s.label }}
                        />
                        {s.sublabel && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{s.sublabel}</p>
                        )}
                        {s.badges && s.badges.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {s.badges.map((badge, bi) => (
                              <span key={bi} className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium border border-red-100">
                                🏷 {badge}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
