"use client";

import React, { useState, useRef, useEffect } from "react";
import { aktuColleges } from "@/data/aktu-colleges";

interface CollegeComboboxProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
}

export default function CollegeCombobox({
  value,
  onChange,
  label = "University",
  required = false,
}: CollegeComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedCollege = aktuColleges.find((c) => c.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredColleges =
    query === ""
      ? aktuColleges.slice(0, 5) // Show top 5 initially
      : aktuColleges
          .filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5);

  return (
    <div className="relative flex flex-col" ref={wrapperRef}>
      {label && (
        <label className="mb-2 text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div
        className="relative cursor-text rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-colors focus-within:border-slate-400 focus-within:bg-white"
        onClick={() => setIsOpen(true)}
      >
        <input
          type="text"
          className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
          placeholder={selectedCollege ? selectedCollege.label : "Search college..."}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {/* Hidden input for native form submission if needed */}
        <input type="hidden" name="university" value={value} required={required} />
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
          <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 top-full">
          {filteredColleges.length === 0 ? (
            <li className="relative cursor-default select-none px-4 py-3 text-slate-500">
              No college found.
            </li>
          ) : (
            filteredColleges.map((college) => (
              <li
                key={college.value}
                className={`relative cursor-pointer select-none px-4 py-2.5 transition-colors hover:bg-slate-50 hover:text-slate-900 ${
                  value === college.value ? "bg-emerald-50 text-emerald-900 font-medium" : "text-slate-700"
                }`}
                onClick={() => {
                  onChange(college.value);
                  setQuery("");
                  setIsOpen(false);
                }}
              >
                <span className="block truncate">{college.label}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
