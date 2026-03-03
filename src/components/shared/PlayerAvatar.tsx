import { DEFAULT_AVATAR, getAvatarDataUri } from '../../lib/avatars.ts';

const SIZES = {
  xs: 'h-5 w-5',
  sm: 'h-7 w-7',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

interface PlayerAvatarProps {
  avatar: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function PlayerAvatar({ avatar, name, size = 'sm' }: PlayerAvatarProps) {
  const src = getAvatarDataUri(avatar || DEFAULT_AVATAR);
  return <img src={src} alt={name} className={`${SIZES[size]} rounded-full object-cover`} />;
}
