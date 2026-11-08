import React from 'react';
import { PersonaCore } from '../types/identity';

export const PersonaAvatar: React.FC<{ core: PersonaCore; size?: 'sm' | 'md' | 'lg' }> = ({
  core,
  size = 'md',
}) => {
  const initials = `${core.firstName.charAt(0)}${core.lastName.charAt(0)}`.toUpperCase();
  const dimensions =
    size === 'sm' ? 'w-9 h-9 text-xs' : size === 'lg' ? 'w-16 h-16 text-xl' : 'w-12 h-12 text-base';

  return (
    <div
      className={`relative rounded-xl flex items-center justify-center font-bold text-white shadow-md shrink-0 select-none ${dimensions}`}
      style={{
        background: `linear-gradient(135deg, ${core.avatarColor}, #1e293b)`,
      }}
    >
      <span>{initials}</span>
      <span
        className="absolute -bottom-1 -right-1 text-sm leading-none bg-white dark:bg-slate-900 rounded-full p-0.5 shadow"
        title={core.countryName}
      >
        {core.flag}
      </span>
    </div>
  );
};
