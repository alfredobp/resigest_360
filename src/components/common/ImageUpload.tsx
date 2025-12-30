"use client";
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  label?: string;
  preview?: boolean;
}

export default function ImageUpload({ 
  value, 
  onChange, 
  bucket = 'images',
  folder = 'uploads',
  label = 'Imagen',
  preview = true
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen debe ser menor a 5MB');
        return;
      }

      const supabase = createClient();

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Debes iniciar sesión para subir imágenes');
        return;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(data.publicUrl);

    } catch (error: any) {
      console.error('Error uploading image:', error);
      setError(error.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    onChange('');
    setError(null);
  };

  return (
    <div>
      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      
      {value && preview ? (
        <div className="relative mb-3">
          <img 
            src={value} 
            alt="Preview" 
            className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 p-1 text-white bg-red-500 rounded-full hover:bg-red-600"
            disabled={uploading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <label className="relative cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={uploadImage}
            disabled={uploading}
            className="hidden"
          />
          <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg ${
            uploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-brand-500 hover:bg-brand-600 cursor-pointer'
          }`}>
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Subiendo...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {value ? 'Cambiar imagen' : 'Subir imagen'}
              </>
            )}
          </span>
        </label>
        
        {value && (
          <input
            type="text"
            value={value}
            readOnly
            className="flex-1 px-3 py-2 text-xs text-gray-600 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400"
            placeholder="URL de la imagen"
          />
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        JPG, PNG o GIF. Máximo 5MB.
      </p>
    </div>
  );
}
