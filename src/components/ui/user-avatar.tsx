import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  avatarUrl?: string | null;
  userName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserAvatar({ avatarUrl, userName, size = 'md', className }: UserAvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-2xl'
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={userName} />
      ) : (
        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-primary font-semibold">
          {getInitials(userName)}
        </AvatarFallback>
      )}
    </Avatar>
  );
}