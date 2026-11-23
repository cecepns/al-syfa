import React from 'react';
import Select from 'react-select';

/**
 * Custom styling for react-select matching Alsyifa theme
 */
export const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '0.75rem', // rounded-xl
    borderColor: state.isFocused ? '#10b981' : '#e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
    backgroundColor: '#ffffff',
    minHeight: '38px',
    fontSize: '0.75rem', // 12px / text-xs
    fontWeight: 500,
    '&:hover': {
      borderColor: '#cbd5e1',
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.75rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    zIndex: 9999,
    fontSize: '0.75rem',
    overflow: 'hidden',
    border: '1px solid #f1f5f9',
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#059669'
      : state.isFocused
      ? '#ecfdf5'
      : 'transparent',
    color: state.isSelected ? '#ffffff' : '#334155',
    fontWeight: state.isSelected ? 700 : 500,
    fontSize: '0.75rem',
    cursor: 'pointer',
    padding: '8px 12px',
    '&:active': {
      backgroundColor: '#047857',
      color: '#ffffff',
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: '#1e293b',
    fontWeight: 600,
  }),
  placeholder: (base) => ({
    ...base,
    color: '#94a3b8',
    fontSize: '0.75rem',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: '#94a3b8',
    padding: '6px',
    '&:hover': {
      color: '#64748b',
    },
  }),
};

export default function AppSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Pilih...',
  isClearable = false,
  isDisabled = false,
  isSearchable = true,
  className = '',
  styles = {},
  menuPlacement = 'auto',
  ...props
}) {
  // Map primitive value to option object if needed
  const selectedOption = options.find((opt) => opt.value === value) || (
    typeof value === 'object' && value !== null ? value : null
  );

  const handleChange = (selected) => {
    if (onChange) {
      // Support passing both primitive value or standard event
      onChange(selected ? selected.value : '');
    }
  };

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={handleChange}
      placeholder={placeholder}
      isClearable={isClearable}
      isDisabled={isDisabled}
      isSearchable={isSearchable}
      styles={{ ...customSelectStyles, ...styles }}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
      menuPlacement={menuPlacement}
      className={`app-react-select ${className}`}
      {...props}
    />
  );
}
