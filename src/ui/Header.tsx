import { Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onGoHome: () => void;
}

export function Header({ onOpenSettings, onGoHome }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-grafito/20">
      <button type="button" onClick={onGoHome} className="flex items-center gap-2">
        <img src="/criterio-logo.svg" alt="" className="h-6 w-6" />
        <span className="font-display text-lg text-papel">Criterio</span>
      </button>
      <button
        type="button"
        onClick={onOpenSettings}
        className="text-grafito hover:text-papel"
        aria-label="configuración"
      >
        <Settings size={18} />
      </button>
    </header>
  );
}
