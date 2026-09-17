"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronDown, Search } from "lucide-react";

const COUNTRIES = [
  { name: "Afghanistan", code: "AF", dial: "+93", flag: "af" },
  { name: "Albania", code: "AL", dial: "+355", flag: "al" },
  { name: "Algeria", code: "DZ", dial: "+213", flag: "dz" },
  { name: "Andorra", code: "AD", dial: "+376", flag: "ad" },
  { name: "Angola", code: "AO", dial: "+244", flag: "ao" },
  { name: "Argentina", code: "AR", dial: "+54", flag: "ar" },
  { name: "Armenia", code: "AM", dial: "+374", flag: "am" },
  { name: "Australia", code: "AU", dial: "+61", flag: "au" },
  { name: "Austria", code: "AT", dial: "+43", flag: "at" },
  { name: "Azerbaijan", code: "AZ", dial: "+994", flag: "az" },
  { name: "Bahrain", code: "BH", dial: "+973", flag: "bh" },
  { name: "Bangladesh", code: "BD", dial: "+880", flag: "bd" },
  { name: "Belarus", code: "BY", dial: "+375", flag: "by" },
  { name: "Belgium", code: "BE", dial: "+32", flag: "be" },
  { name: "Belize", code: "BZ", dial: "+501", flag: "bz" },
  { name: "Benin", code: "BJ", dial: "+229", flag: "bj" },
  { name: "Bhutan", code: "BT", dial: "+975", flag: "bt" },
  { name: "Bolivia", code: "BO", dial: "+591", flag: "bo" },
  { name: "Bosnia and Herzegovina", code: "BA", dial: "+387", flag: "ba" },
  { name: "Botswana", code: "BW", dial: "+267", flag: "bw" },
  { name: "Brazil", code: "BR", dial: "+55", flag: "br" },
  { name: "Brunei", code: "BN", dial: "+673", flag: "bn" },
  { name: "Bulgaria", code: "BG", dial: "+359", flag: "bg" },
  { name: "Burkina Faso", code: "BF", dial: "+226", flag: "bf" },
  { name: "Burundi", code: "BI", dial: "+257", flag: "bi" },
  { name: "Cambodia", code: "KH", dial: "+855", flag: "kh" },
  { name: "Cameroon", code: "CM", dial: "+237", flag: "cm" },
  { name: "Canada", code: "CA", dial: "+1", flag: "ca" },
  { name: "Cape Verde", code: "CV", dial: "+238", flag: "cv" },
  { name: "Central African Republic", code: "CF", dial: "+236", flag: "cf" },
  { name: "Chad", code: "TD", dial: "+235", flag: "td" },
  { name: "Chile", code: "CL", dial: "+56", flag: "cl" },
  { name: "China", code: "CN", dial: "+86", flag: "cn" },
  { name: "Colombia", code: "CO", dial: "+57", flag: "co" },
  { name: "Comoros", code: "KM", dial: "+269", flag: "km" },
  { name: "Congo", code: "CG", dial: "+242", flag: "cg" },
  { name: "Costa Rica", code: "CR", dial: "+506", flag: "cr" },
  { name: "Croatia", code: "HR", dial: "+385", flag: "hr" },
  { name: "Cuba", code: "CU", dial: "+53", flag: "cu" },
  { name: "Cyprus", code: "CY", dial: "+357", flag: "cy" },
  { name: "Czech Republic", code: "CZ", dial: "+420", flag: "cz" },
  { name: "Denmark", code: "DK", dial: "+45", flag: "dk" },
  { name: "Djibouti", code: "DJ", dial: "+253", flag: "dj" },
  { name: "Dominican Republic", code: "DO", dial: "+1-809", flag: "do" },
  { name: "Ecuador", code: "EC", dial: "+593", flag: "ec" },
  { name: "Egypt", code: "EG", dial: "+20", flag: "eg" },
  { name: "El Salvador", code: "SV", dial: "+503", flag: "sv" },
  { name: "Equatorial Guinea", code: "GQ", dial: "+240", flag: "gq" },
  { name: "Eritrea", code: "ER", dial: "+291", flag: "er" },
  { name: "Estonia", code: "EE", dial: "+372", flag: "ee" },
  { name: "Eswatini", code: "SZ", dial: "+268", flag: "sz" },
  { name: "Ethiopia", code: "ET", dial: "+251", flag: "et" },
  { name: "Fiji", code: "FJ", dial: "+679", flag: "fj" },
  { name: "Finland", code: "FI", dial: "+358", flag: "fi" },
  { name: "France", code: "FR", dial: "+33", flag: "fr" },
  { name: "Gabon", code: "GA", dial: "+241", flag: "ga" },
  { name: "Gambia", code: "GM", dial: "+220", flag: "gm" },
  { name: "Georgia", code: "GE", dial: "+995", flag: "ge" },
  { name: "Germany", code: "DE", dial: "+49", flag: "de" },
  { name: "Ghana", code: "GH", dial: "+233", flag: "gh" },
  { name: "Greece", code: "GR", dial: "+30", flag: "gr" },
  { name: "Guatemala", code: "GT", dial: "+502", flag: "gt" },
  { name: "Guinea", code: "GN", dial: "+224", flag: "gn" },
  { name: "Guinea-Bissau", code: "GW", dial: "+245", flag: "gw" },
  { name: "Guyana", code: "GY", dial: "+592", flag: "gy" },
  { name: "Haiti", code: "HT", dial: "+509", flag: "ht" },
  { name: "Honduras", code: "HN", dial: "+504", flag: "hn" },
  { name: "Hungary", code: "HU", dial: "+36", flag: "hu" },
  { name: "Iceland", code: "IS", dial: "+354", flag: "is" },
  { name: "India", code: "IN", dial: "+91", flag: "in" },
  { name: "Indonesia", code: "ID", dial: "+62", flag: "id" },
  { name: "Iran", code: "IR", dial: "+98", flag: "ir" },
  { name: "Iraq", code: "IQ", dial: "+964", flag: "iq" },
  { name: "Ireland", code: "IE", dial: "+353", flag: "ie" },
  { name: "Israel", code: "IL", dial: "+972", flag: "il" },
  { name: "Italy", code: "IT", dial: "+39", flag: "it" },
  { name: "Ivory Coast", code: "CI", dial: "+225", flag: "ci" },
  { name: "Jamaica", code: "JM", dial: "+1-876", flag: "jm" },
  { name: "Japan", code: "JP", dial: "+81", flag: "jp" },
  { name: "Jordan", code: "JO", dial: "+962", flag: "jo" },
  { name: "Kazakhstan", code: "KZ", dial: "+7", flag: "kz" },
  { name: "Kenya", code: "KE", dial: "+254", flag: "ke" },
  { name: "Kuwait", code: "KW", dial: "+965", flag: "kw" },
  { name: "Kyrgyzstan", code: "KG", dial: "+996", flag: "kg" },
  { name: "Laos", code: "LA", dial: "+856", flag: "la" },
  { name: "Latvia", code: "LV", dial: "+371", flag: "lv" },
  { name: "Lebanon", code: "LB", dial: "+961", flag: "lb" },
  { name: "Lesotho", code: "LS", dial: "+266", flag: "ls" },
  { name: "Liberia", code: "LR", dial: "+231", flag: "lr" },
  { name: "Libya", code: "LY", dial: "+218", flag: "ly" },
  { name: "Liechtenstein", code: "LI", dial: "+423", flag: "li" },
  { name: "Lithuania", code: "LT", dial: "+370", flag: "lt" },
  { name: "Luxembourg", code: "LU", dial: "+352", flag: "lu" },
  { name: "Madagascar", code: "MG", dial: "+261", flag: "mg" },
  { name: "Malawi", code: "MW", dial: "+265", flag: "mw" },
  { name: "Malaysia", code: "MY", dial: "+60", flag: "my" },
  { name: "Maldives", code: "MV", dial: "+960", flag: "mv" },
  { name: "Mali", code: "ML", dial: "+223", flag: "ml" },
  { name: "Malta", code: "MT", dial: "+356", flag: "mt" },
  { name: "Mauritania", code: "MR", dial: "+222", flag: "mr" },
  { name: "Mauritius", code: "MU", dial: "+230", flag: "mu" },
  { name: "Mexico", code: "MX", dial: "+52", flag: "mx" },
  { name: "Moldova", code: "MD", dial: "+373", flag: "md" },
  { name: "Monaco", code: "MC", dial: "+377", flag: "mc" },
  { name: "Mongolia", code: "MN", dial: "+976", flag: "mn" },
  { name: "Montenegro", code: "ME", dial: "+382", flag: "me" },
  { name: "Morocco", code: "MA", dial: "+212", flag: "ma" },
  { name: "Mozambique", code: "MZ", dial: "+258", flag: "mz" },
  { name: "Myanmar", code: "MM", dial: "+95", flag: "mm" },
  { name: "Namibia", code: "NA", dial: "+264", flag: "na" },
  { name: "Nepal", code: "NP", dial: "+977", flag: "np" },
  { name: "Netherlands", code: "NL", dial: "+31", flag: "nl" },
  { name: "New Zealand", code: "NZ", dial: "+64", flag: "nz" },
  { name: "Nicaragua", code: "NI", dial: "+505", flag: "ni" },
  { name: "Niger", code: "NE", dial: "+227", flag: "ne" },
  { name: "Nigeria", code: "NG", dial: "+234", flag: "ng" },
  { name: "North Korea", code: "KP", dial: "+850", flag: "kp" },
  { name: "North Macedonia", code: "MK", dial: "+389", flag: "mk" },
  { name: "Norway", code: "NO", dial: "+47", flag: "no" },
  { name: "Oman", code: "OM", dial: "+968", flag: "om" },
  { name: "Pakistan", code: "PK", dial: "+92", flag: "pk" },
  { name: "Palestine", code: "PS", dial: "+970", flag: "ps" },
  { name: "Panama", code: "PA", dial: "+507", flag: "pa" },
  { name: "Papua New Guinea", code: "PG", dial: "+675", flag: "pg" },
  { name: "Paraguay", code: "PY", dial: "+595", flag: "py" },
  { name: "Peru", code: "PE", dial: "+51", flag: "pe" },
  { name: "Philippines", code: "PH", dial: "+63", flag: "ph" },
  { name: "Poland", code: "PL", dial: "+48", flag: "pl" },
  { name: "Portugal", code: "PT", dial: "+351", flag: "pt" },
  { name: "Qatar", code: "QA", dial: "+974", flag: "qa" },
  { name: "Romania", code: "RO", dial: "+40", flag: "ro" },
  { name: "Russia", code: "RU", dial: "+7", flag: "ru" },
  { name: "Rwanda", code: "RW", dial: "+250", flag: "rw" },
  { name: "Saudi Arabia", code: "SA", dial: "+966", flag: "sa" },
  { name: "Senegal", code: "SN", dial: "+221", flag: "sn" },
  { name: "Serbia", code: "RS", dial: "+381", flag: "rs" },
  { name: "Sierra Leone", code: "SL", dial: "+232", flag: "sl" },
  { name: "Singapore", code: "SG", dial: "+65", flag: "sg" },
  { name: "Slovakia", code: "SK", dial: "+421", flag: "sk" },
  { name: "Slovenia", code: "SI", dial: "+386", flag: "si" },
  { name: "Somalia", code: "SO", dial: "+252", flag: "so" },
  { name: "South Africa", code: "ZA", dial: "+27", flag: "za" },
  { name: "South Korea", code: "KR", dial: "+82", flag: "kr" },
  { name: "South Sudan", code: "SS", dial: "+211", flag: "ss" },
  { name: "Spain", code: "ES", dial: "+34", flag: "es" },
  { name: "Sri Lanka", code: "LK", dial: "+94", flag: "lk" },
  { name: "Sudan", code: "SD", dial: "+249", flag: "sd" },
  { name: "Suriname", code: "SR", dial: "+597", flag: "sr" },
  { name: "Sweden", code: "SE", dial: "+46", flag: "se" },
  { name: "Switzerland", code: "CH", dial: "+41", flag: "ch" },
  { name: "Syria", code: "SY", dial: "+963", flag: "sy" },
  { name: "Taiwan", code: "TW", dial: "+886", flag: "tw" },
  { name: "Tajikistan", code: "TJ", dial: "+992", flag: "tj" },
  { name: "Tanzania", code: "TZ", dial: "+255", flag: "tz" },
  { name: "Thailand", code: "TH", dial: "+66", flag: "th" },
  { name: "Timor-Leste", code: "TL", dial: "+670", flag: "tl" },
  { name: "Togo", code: "TG", dial: "+228", flag: "tg" },
  { name: "Trinidad and Tobago", code: "TT", dial: "+1-868", flag: "tt" },
  { name: "Tunisia", code: "TN", dial: "+216", flag: "tn" },
  { name: "Turkey", code: "TR", dial: "+90", flag: "tr" },
  { name: "Turkmenistan", code: "TM", dial: "+993", flag: "tm" },
  { name: "Uganda", code: "UG", dial: "+256", flag: "ug" },
  { name: "Ukraine", code: "UA", dial: "+380", flag: "ua" },
  { name: "United Arab Emirates", code: "AE", dial: "+971", flag: "ae" },
  { name: "United Kingdom", code: "GB", dial: "+44", flag: "gb" },
  { name: "United States", code: "US", dial: "+1", flag: "us" },
  { name: "Uruguay", code: "UY", dial: "+598", flag: "uy" },
  { name: "Uzbekistan", code: "UZ", dial: "+998", flag: "uz" },
  { name: "Venezuela", code: "VE", dial: "+58", flag: "ve" },
  { name: "Vietnam", code: "VN", dial: "+84", flag: "vn" },
  { name: "Yemen", code: "YE", dial: "+967", flag: "ye" },
  { name: "Zambia", code: "ZM", dial: "+260", flag: "zm" },
  { name: "Zimbabwe", code: "ZW", dial: "+263", flag: "zw" },
];

const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.code === "IN");

export default function PhoneInput({ name, value, onChange, placeholder, error: externalError }) {
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [internalValue, setInternalValue] = useState(value || "");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (value !== undefined && value !== null) {
      // Strip any dial code prefix, keep only digits, max 10
      const digits = value.toString().replace(/\D/g, "");
      setInternalValue(digits.slice(-10));
    }
  }, [value]);

  const handleInputChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
    setInternalValue(cleaned);
    setError("");
    onChange({ target: { name, value: cleaned } });
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setOpen(false);
    setSearch("");
    // don't change the number value, just the country display
  };

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  return (
    <div className="w-full">
      <div className="relative flex items-center" ref={dropdownRef}>
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="absolute left-0 h-full flex items-center gap-1.5 px-2 border-r border-gray-200 bg-transparent z-10 hover:bg-gray-50 rounded-l-lg transition-colors"
          style={{ minWidth: "72px" }}
        >
          <img
            src={`https://flagcdn.com/w20/${selectedCountry.flag}.png`}
            alt={selectedCountry.code}
            className="w-5 h-auto shadow-sm rounded-sm flex-shrink-0"
          />
          <span className="text-xs font-bold text-gray-500">{selectedCountry.dial}</span>
          <ChevronDown size={12} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        <input
          type="tel"
          name={name}
          value={internalValue}
          onChange={handleInputChange}
          placeholder={placeholder || "Enter phone number"}
          className="w-full pl-[80px] pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-semibold tracking-wider font-mono"
        />

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>
            {/* List */}
            <ul className="max-h-56 overflow-y-auto">
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-gray-400 text-center">No results</li>
              )}
              {filtered.map((country) => (
                <li
                  key={country.code}
                  onClick={() => handleCountrySelect(country)}
                  className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm transition-colors ${
                    selectedCountry.code === country.code ? "bg-blue-50 font-semibold" : ""
                  }`}
                >
                  <img
                    src={`https://flagcdn.com/w20/${country.flag}.png`}
                    alt={country.code}
                    className="w-5 h-auto rounded-sm flex-shrink-0"
                  />
                  <span className="flex-1 truncate text-gray-700">{country.name}</span>
                  <span className="text-gray-400 text-xs font-mono">{country.dial}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {(externalError || error) && <p className="text-[10px] text-red-500 mt-1 font-medium italic">* {externalError || error}</p>}
    </div>
  );
}
