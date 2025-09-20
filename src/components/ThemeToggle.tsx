import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import Button from './ui/Button';

const ThemeToggle: React.FC = () => {
  const { state, setTheme } = useApp();

  const toggleTheme = () => {
    setTheme(state.theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative"
      aria-label={`Switch to ${state.theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {state.theme === 'light' ? (
        <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      ) : (
        <Sun className="h-5 w-5 text-yellow-500" />
      )}
    </Button>
  );
};

export default React.memo(ThemeToggle);