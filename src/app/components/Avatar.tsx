import { useState } from 'react';

const PALETTE = [
  '#7C3AED', '#2563EB', '#059669', '#DC2626',
  '#D97706', '#0891B2', '#BE185D', '#EA580C',
];

function colorFor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/[\s_@]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const UNSPLASH_DEFAULTS = [
  'photo-1589421354948',
  'photo-1535713875002',
  'photo-1472099645785',
  'photo-1549924231',
];

function isDefaultUnsplash(src?: string): boolean {
  if (!src) return false;
  return UNSPLASH_DEFAULTS.some(id => src.includes(id));
}

interface AvatarProps {
  src?: string;
  username?: string;
  className?: string;
  alt?: string;
}

export function Avatar({ src, username, className = '', alt }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  const showImage = src && !isDefaultUnsplash(src) && !failed;
  const bg = colorFor(username || '?');
  const text = initials(username);

  if (showImage) {
    return (
      <img
        src={src}
        alt={alt || username || 'User'}
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={className}
      style={{ backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.75em', letterSpacing: '0.02em', flexShrink: 0 }}
      aria-label={alt || username || 'User'}
    >
      {text}
    </div>
  );
}
