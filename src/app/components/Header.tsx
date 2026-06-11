import { Avatar } from './Avatar';
import { Menu, Search, Bell, LogOut, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  onLogout: () => void;
  userAvatar?: string;
  notificationCount?: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function Header({ onMenuToggle, onLogout, userAvatar, notificationCount = 0, theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="sticky top-0 z-60 border-b border-slate-700/60 bg-slate-950/95 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto w-full px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden rounded-2xl bg-slate-900/75 p-2 text-slate-100 shadow-sm transition hover:bg-slate-800"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/75 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 shadow-sm">
            <span className="text-blue-300">CampusLink</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="hidden md:flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/75 px-3 py-2 w-full max-w-2xl">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search for products, jobs, people..."
              className="w-full min-w-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <button
            className="relative rounded-2xl bg-slate-900/80 p-2 text-slate-100 transition hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[0.65rem] font-semibold text-white">
                {notificationCount}
              </span>
            )}
          </button>
          <button
            onClick={onToggleTheme}
            className="rounded-2xl bg-slate-900/80 p-2 text-slate-100 transition hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button className="hidden sm:inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-2 text-slate-100 transition hover:bg-slate-800">
            <Avatar src={userAvatar} username="me" className="w-8 h-8 rounded-full object-cover border border-slate-700/60" />
            <span className="text-sm font-medium">Me</span>
          </button>
          <button
            onClick={onLogout}
            className="rounded-2xl bg-red-500/10 px-3 py-2 text-sm text-red-200 transition hover:bg-red-500/15"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
