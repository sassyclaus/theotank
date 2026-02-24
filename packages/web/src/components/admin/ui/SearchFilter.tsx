import { Search } from "lucide-react";

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchFilter({
  value,
  onChange,
  placeholder = "Search...",
}: SearchFilterProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-admin-border bg-white py-2 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
      />
    </div>
  );
}
