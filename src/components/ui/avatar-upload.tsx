import React, { useState, useRef } from 'react';
import { Upload, Trash2, Camera } from 'lucide-react';
import { Button } from './button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userId: string;
  userName: string;
  isCurrentUser?: boolean;
  isAdmin?: boolean;
  onAvatarUpdate: (newAvatarUrl: string | null) => void;
}

export function AvatarUpload({ 
  currentAvatarUrl, 
  userId, 
  userName, 
  isCurrentUser = false, 
  isAdmin = false,
  onAvatarUpdate 
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const canEdit = isCurrentUser || isAdmin;

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);

      // Create a canvas to crop the image to a circle
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise<void>((resolve, reject) => {
        img.onload = async () => {
          // Set canvas size to 200x200 for profile pictures
          const size = 200;
          canvas.width = size;
          canvas.height = size;

          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Draw circular clipped image
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.clip();

          // Calculate scaling to fit image in circle
          const scale = Math.min(size / img.width, size / img.height);
          const x = (size - img.width * scale) / 2;
          const y = (size - img.height * scale) / 2;

          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

          // Convert canvas to blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('Failed to create image blob'));
              return;
            }

            const fileExt = 'png';
            const fileName = `${userId}/avatar.${fileExt}`;

            // Delete existing avatar if it exists
            if (currentAvatarUrl) {
              const existingPath = currentAvatarUrl.split('/').pop();
              if (existingPath) {
                await supabase.storage
                  .from('avatars')
                  .remove([`${userId}/${existingPath}`]);
              }
            }

            // Upload new avatar
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, blob, {
                cacheControl: '3600',
                upsert: true
              });

            if (uploadError) {
              reject(uploadError);
              return;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);

            // Update profile with new avatar URL
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ avatar_url: publicUrl })
              .eq('id', userId);

            if (updateError) {
              reject(updateError);
              return;
            }

            onAvatarUpdate(publicUrl);
            toast.success('Profile picture updated successfully!');
            resolve();
          }, 'image/png', 0.9);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const deleteAvatar = async () => {
    if (!currentAvatarUrl) return;

    try {
      setDeleting(true);

      // Extract file path from URL
      const fileName = currentAvatarUrl.split('/').pop();
      if (!fileName) return;

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([`${userId}/${fileName}`]);

      if (deleteError) {
        console.error('Error deleting from storage:', deleteError);
      }

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        toast.error('Failed to remove profile picture');
        return;
      }

      onAvatarUpdate(null);
      toast.success('Profile picture removed successfully!');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error('Failed to remove profile picture');
    } finally {
      setDeleting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    uploadAvatar(file);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="h-24 w-24">
          {currentAvatarUrl ? (
            <AvatarImage src={currentAvatarUrl} alt={userName} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-primary font-semibold text-lg">
              {getInitials(userName)}
            </AvatarFallback>
          )}
        </Avatar>
        
        {canEdit && (
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      {canEdit && (
        <div className="flex gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || deleting}
            size="sm"
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : currentAvatarUrl ? 'Change' : 'Upload'}
          </Button>
          
          {currentAvatarUrl && (
            <Button
              onClick={deleteAvatar}
              disabled={uploading || deleting}
              size="sm"
              variant="outline"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Removing...' : 'Remove'}
            </Button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}