import { useState, useEffect, useRef } from 'react';
import { Search, Calendar, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// import { useDebounce } from '../hooks/useDebounce'; // Removed: Used inline logic or not needed if inline implemented
import axios from '../api/axios'; // Or standard axios if not wrapped

// Inline debounce hook if not exists, but I'll write the component assuming I might need to implement the fetch logic.
// Simulating clean architecture.

interface SearchResult {
    patients: any[];
    appointments: any[];
}

export const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult | null>(null);
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce Logic
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(handler);
    }, [query]);

    useEffect(() => {
        const search = async () => {
            if (debouncedQuery.length < 2) {
                setResults(null);
                return;
            }
            try {
                // Use relative path or configured axios instance
                // Assuming standard headers are set by interceptors (auth, tenancy)
                const res = await axios.get(`/search?q=${encodeURIComponent(debouncedQuery)}`);
                setResults(res.data);
                setShowResults(true);
            } catch (e) {
                console.error("Search failed", e);
            }
        };

        if (debouncedQuery) search();
        else setResults(null);
    }, [debouncedQuery]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (path: string) => {
        navigate(path);
        setShowResults(false);
        setQuery('');
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-md mx-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                    type="text"
                    placeholder="Buscar pacientes, citas..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (results) setShowResults(true); }}
                />
                {query && (
                    <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                    </button>
                )}
            </div>

            {showResults && results && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">

                    {/* PACIENTS SECTION */}
                    {results.patients.length > 0 && (
                        <div className="py-2">
                            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pacientes</h3>
                            {results.patients.map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => handleSelect(`/patients/${p.id}`)}
                                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors"
                                >
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                        {p.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-700">{p.name}</div>
                                        <div className="text-xs text-slate-400">{p.email || 'Sin email'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* APPOINTMENTS SECTION */}
                    {results.appointments.length > 0 && (
                        <div className="py-2 border-t border-slate-100">
                            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Citas</h3>
                            {results.appointments.map((a) => (
                                <div
                                    key={a.id}
                                    // Navigate to calendar? Or specific appointment view? 
                                    // User said: "/appointments" or modal. I'll go to calendar for now.
                                    onClick={() => handleSelect(`/dashboard/calendar`)}
                                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors"
                                >
                                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-700">{a.title}</div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(a.start).toLocaleDateString()} - {a.patient?.name}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {results.patients.length === 0 && results.appointments.length === 0 && (
                        <div className="p-4 text-center text-slate-400 text-sm">
                            No se encontraron resultados
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
