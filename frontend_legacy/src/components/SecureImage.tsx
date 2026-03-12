import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback?: string;
}

export const SecureImage: React.FC<SecureImageProps> = ({ src, fallback = 'https://placehold.co/100x100?text=Error', ...props }) => {
  const { token } = useAuth();
  const [imageSrc, setImageSrc] = useState<string>('https://placehold.co/100x100?text=Cargando...');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchImage = async () => {
        if (!src || src.startsWith('http') || src.startsWith('data:')) {
            setImageSrc(src || fallback);
            return;
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const endpoint = `${API_URL}/media/stream?path=${encodeURIComponent(src)}`;

            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Error cargando imagen');

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            
            if (isMounted) setImageSrc(objectUrl);
        } catch (err) {
            console.error("Error SecureImage:", err);
            if (isMounted) {
                setHasError(true);
                setImageSrc(fallback);
            }
        }
    };

    if (token) fetchImage();

    return () => {
        isMounted = false;
        if (imageSrc.startsWith('blob:')) URL.revokeObjectURL(imageSrc);
    };
  }, [src, token]);

  if (hasError) return <img src={fallback} {...props} />;
  return <img src={imageSrc} {...props} />;
};