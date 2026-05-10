"use client";

import { useState } from "react";

interface SearchBarProps {
    placeholder?: string;
    onSearch?: (value: string) => void;
    variant?: "glass" | "default";
}

export default function SearchBar({
    placeholder = "Bạn muốn đi đâu?",
    onSearch,
    variant = "glass",
}: SearchBarProps) {
    const [searchValue, setSearchValue] = useState("");

    const handleSearch = () => {
        if (onSearch) {
            onSearch(searchValue);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    if (variant === "glass") {
        return (
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20 shadow-2xl flex flex-col md:flex-row gap-2 max-w-2xl">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-8 py-4 rounded-[1.5rem] bg-white text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                <button
                    onClick={handleSearch}
                    className="px-10 py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-[1.5rem] transition-all active:scale-95 shadow-lg shadow-sky-600/20"
                >
                    Tìm kiếm ngay
                </button>
            </div>
        );
    }

    // Default variant
    return (
        <div className="p-2 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20 shadow-2xl flex flex-col md:flex-row gap-2 max-w-2xl">
            <input
                type="text"
                placeholder={placeholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-8 py-4 rounded-[1.5rem] bg-white text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            <button
                onClick={handleSearch}
                className="px-10 py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-[1.5rem] transition-all active:scale-95 shadow-lg shadow-sky-600/20"
            >
                Tìm kiếm ngayyyy
            </button>
        </div>
    );
}
