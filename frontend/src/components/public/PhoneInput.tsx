import React, { useEffect, useState } from "react";

interface Country {
  iso: string;
  name: string;
  dial: string;
  flag: string;
}

// A practical, not-exhaustive list of countries, US first as the default
// for this Ohio/North Dakota-based company.
const COUNTRIES: Country[] = [
  { iso: "US", name: "United States", dial: "+1", flag: "\u{1F1FA}\u{1F1F8}" },
  { iso: "CA", name: "Canada", dial: "+1", flag: "\u{1F1E8}\u{1F1E6}" },
  { iso: "MX", name: "Mexico", dial: "+52", flag: "\u{1F1F2}\u{1F1FD}" },
  { iso: "GB", name: "United Kingdom", dial: "+44", flag: "\u{1F1EC}\u{1F1E7}" },
  { iso: "IE", name: "Ireland", dial: "+353", flag: "\u{1F1EE}\u{1F1EA}" },
  { iso: "FR", name: "France", dial: "+33", flag: "\u{1F1EB}\u{1F1F7}" },
  { iso: "DE", name: "Germany", dial: "+49", flag: "\u{1F1E9}\u{1F1EA}" },
  { iso: "ES", name: "Spain", dial: "+34", flag: "\u{1F1EA}\u{1F1F8}" },
  { iso: "IT", name: "Italy", dial: "+39", flag: "\u{1F1EE}\u{1F1F9}" },
  { iso: "PT", name: "Portugal", dial: "+351", flag: "\u{1F1F5}\u{1F1F9}" },
  { iso: "NL", name: "Netherlands", dial: "+31", flag: "\u{1F1F3}\u{1F1F1}" },
  { iso: "NG", name: "Nigeria", dial: "+234", flag: "\u{1F1F3}\u{1F1EC}" },
  { iso: "GH", name: "Ghana", dial: "+233", flag: "\u{1F1EC}\u{1F1ED}" },
  { iso: "KE", name: "Kenya", dial: "+254", flag: "\u{1F1F0}\u{1F1EA}" },
  { iso: "ZA", name: "South Africa", dial: "+27", flag: "\u{1F1FF}\u{1F1E6}" },
  { iso: "ET", name: "Ethiopia", dial: "+251", flag: "\u{1F1EA}\u{1F1F9}" },
  { iso: "EG", name: "Egypt", dial: "+20", flag: "\u{1F1EA}\u{1F1EC}" },
  { iso: "IN", name: "India", dial: "+91", flag: "\u{1F1EE}\u{1F1F3}" },
  { iso: "PK", name: "Pakistan", dial: "+92", flag: "\u{1F1F5}\u{1F1F0}" },
  { iso: "PH", name: "Philippines", dial: "+63", flag: "\u{1F1F5}\u{1F1ED}" },
  { iso: "VN", name: "Vietnam", dial: "+84", flag: "\u{1F1FB}\u{1F1F3}" },
  { iso: "CN", name: "China", dial: "+86", flag: "\u{1F1E8}\u{1F1F3}" },
  { iso: "JP", name: "Japan", dial: "+81", flag: "\u{1F1EF}\u{1F1F5}" },
  { iso: "KR", name: "South Korea", dial: "+82", flag: "\u{1F1F0}\u{1F1F7}" },
  { iso: "BR", name: "Brazil", dial: "+55", flag: "\u{1F1E7}\u{1F1F7}" },
  { iso: "CO", name: "Colombia", dial: "+57", flag: "\u{1F1E8}\u{1F1F4}" },
  { iso: "HT", name: "Haiti", dial: "+509", flag: "\u{1F1ED}\u{1F1F9}" },
  { iso: "JM", name: "Jamaica", dial: "+1876", flag: "\u{1F1EF}\u{1F1F2}" },
  { iso: "AU", name: "Australia", dial: "+61", flag: "\u{1F1E6}\u{1F1FA}" },
  { iso: "SO", name: "Somalia", dial: "+252", flag: "\u{1F1F8}\u{1F1F4}" },
];

interface Props {
  id?: string;
  value: string; // combined value, e.g. "+1 6145550100"
  onChange: (value: string) => void;
  required?: boolean;
}

const parseValue = (value: string): { dial: string; number: string } => {
  const match = COUNTRIES.find((c) => value.startsWith(c.dial + " "));
  if (match) return { dial: match.dial, number: value.slice(match.dial.length + 1) };
  return { dial: "+1", number: value.replace(/^\+\d+\s*/, "") };
};

const PhoneInput: React.FC<Props> = ({ id, value, onChange, required }) => {
  const initial = parseValue(value);
  const [dial, setDial] = useState(initial.dial);
  const [number, setNumber] = useState(initial.number);

  useEffect(() => {
    onChange(number ? `${dial} ${number}` : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dial, number]);

  return (
    <div className="phone-input">
      <select
        aria-label="Country code"
        value={dial}
        onChange={(e) => setDial(e.target.value)}
        className="phone-input__code"
      >
        {COUNTRIES.map((c) => (
          <option key={c.iso} value={c.dial}>
            {c.flag} {c.dial}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        className="phone-input__number"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        required={required}
        placeholder="Phone number"
      />
    </div>
  );
};

export default PhoneInput;
