import { Plus, Minus } from 'lucide-react';

export default function NumberInput({ value, onChange, min = 0, max = null, step = 1, className = '', disabled = false }) {
    const handleIncrement = () => {
        if (disabled) return;
        const current = parseFloat(value) || 0;
        const next = current + step;
        if (max === null || next <= max) {
            onChange(next);
        }
    };

    const handleDecrement = () => {
        if (disabled) return;
        const current = parseFloat(value) || 0;
        const next = current - step;
        if (next >= min) {
            onChange(next);
        }
    };

    return (
        <div className={`flex items-center w-32 border border-stone-200 rounded-xl overflow-hidden bg-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
            <button
                type="button"
                onClick={handleDecrement}
                disabled={disabled || (parseFloat(value) || 0) <= min}
                className="flex items-center justify-center w-10 h-10 bg-stone-50 text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Minus size={16} />
            </button>
            <input
                type="number"
                min={min}
                max={max ?? undefined}
                step={step}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="flex-1 w-full text-center h-10 border-none font-bold text-slate-900 focus:ring-0 p-0"
                style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
            />
            <button
                type="button"
                onClick={handleIncrement}
                disabled={disabled || (max !== null && (parseFloat(value) || 0) >= max)}
                className="flex items-center justify-center w-10 h-10 bg-stone-50 text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus size={16} />
            </button>
        </div>
    );
}
