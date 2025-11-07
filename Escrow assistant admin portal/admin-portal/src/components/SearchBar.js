
export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || 'Search...'}
      style={{
        padding: 8,
        borderRadius: 6,
        border: '1px solid #bbb',
        marginBottom: 16,
        minWidth: 220
      }}
    />
  );
}
