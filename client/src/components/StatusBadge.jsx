import React from 'react';

const StatusBadge = ({ type, text }) => {
  const styles = {
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-rose-100 text-rose-700 border-rose-200',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    neutral: 'bg-stone-100 text-stone-600 border-stone-200',
    info: 'bg-sky-100 text-sky-700 border-sky-200'
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[type] || styles.neutral}`}>
      {text}
    </span>
  );
};

export default StatusBadge;
