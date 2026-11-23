import React, { useRef, useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import { customSelectStyles } from './AppSelect';

/**
 * Debounced Async React Select for Database / API Search
 * Debounce min: 350ms (compliant with >= 300ms rule in AGENTS.md)
 */
export default function DebouncedAsyncSelect({
  loadOptions,
  value,
  onChange,
  placeholder = 'Ketik untuk mencari...',
  debounceMs = 350,
  defaultOptions = true,
  isClearable = true,
  isDisabled = false,
  className = '',
  styles = {},
  selectedLabel = null,
  ...props
}) {
  const timerRef = useRef(null);

  // Debounced loadOptions implementation
  const debouncedLoadOptions = useCallback(
    (inputValue, callback) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(async () => {
        try {
          const results = await loadOptions(inputValue);
          callback(results || []);
        } catch (err) {
          console.error('AsyncSelect search error:', err);
          callback([]);
        }
      }, debounceMs);
    },
    [loadOptions, debounceMs]
  );

  const selectedOption = value && typeof value === 'object'
    ? value
    : value
    ? { value, label: selectedLabel || value }
    : null;

  const handleChange = (selected) => {
    if (onChange) {
      onChange(selected ? selected.value : '', selected);
    }
  };

  return (
    <AsyncSelect
      cacheOptions
      defaultOptions={defaultOptions}
      loadOptions={debouncedLoadOptions}
      value={selectedOption}
      onChange={handleChange}
      placeholder={placeholder}
      isClearable={isClearable}
      isDisabled={isDisabled}
      styles={{ ...customSelectStyles, ...styles }}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
      className={`app-react-select-async ${className}`}
      loadingMessage={() => 'Mencari data dari database...'}
      noOptionsMessage={({ inputValue }) =>
        inputValue ? `Tidak ditemukan "${inputValue}"` : 'Ketik untuk mencari...'
      }
      {...props}
    />
  );
}
