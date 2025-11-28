import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const SecureField = ({ value }) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
      <span className={`font-mono ${revealed ? 'text-stone-800' : 'text-stone-400 tracking-widest'}`}>
        {revealed ? value : '•••• •••• ••••'}
      </span>
      <button
        onClick={() => setRevealed(!revealed)}
        className="text-stone-400 hover:text-stone-600 focus:outline-none"
      >
        {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
};

export default SecureField;
