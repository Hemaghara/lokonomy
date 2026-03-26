import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Store, ShoppingBag, Briefcase, Loader2 } from "lucide-react";
import recommendationService from "../services/recommendationService";

const SmartSearch = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      try {
        const data = await recommendationService.getSuggestions(query);
        setSuggestions(data);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search suggestion error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = (item) => {
    setQuery("");
    setShowDropdown(false);
    
    recommendationService.trackInteraction("click", item.type, item.id);

    if (item.type === "business") navigate(`/business/${item.id}`);
    else if (item.type === "product") navigate(`/market/product/${item.id}`);
    else if (item.type === "job") navigate(`/jobs/${item.id}`);
  };

  const getIcon = (type) => {
    switch (type) {
      case "business": return <Store className="text-blue-400" size={18} />;
      case "product": return <ShoppingBag className="text-pink-400" size={18} />;
      case "job": return <Briefcase className="text-green-400" size={18} />;
      default: return <Search size={18} />;
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto" ref={dropdownRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-text-dim group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for businesses, products, or jobs..."
          className="block w-full pl-10 pr-3 py-3 bg-card-bg/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-2xl text-text-main placeholder:text-text-dim outline-none transition-all glass"
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader2 className="animate-spin text-primary" size={18} />
          </div>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-card-bg border border-border rounded-2xl shadow-2xl overflow-hidden glass backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            {suggestions.map((item, index) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors rounded-xl"
              >
                <div className="p-2 bg-white/5 rounded-lg flex items-center justify-center">
                  {getIcon(item.type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-main">{item.text}</p>
                  <p className="text-xs text-text-dim capitalize">{item.type}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {showDropdown && query.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-2 bg-card-bg border border-border rounded-2xl p-6 text-center glass backdrop-blur-xl">
          <p className="text-text-dim text-sm">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
