import { useState, useEffect } from 'react';
import { searchExerciseModels, type SketchfabModel } from '@/services/sketchfab';

interface ModelViewerProps {
  exerciseName: string;
  className?: string;
}

export default function ModelViewer({ exerciseName, className = '' }: ModelViewerProps) {
  const [model, setModel] = useState<SketchfabModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModel = async () => {
      try {
        setLoading(true);
        setError(null);
        const models = await searchExerciseModels(exerciseName);
        if (models.length > 0) {
          setModel(models[0]); // Use the first model found
        } else {
          setError('No 3D model found for this exercise');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load 3D model');
        console.error('Error loading model:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchModel();
  }, [exerciseName]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[300px] ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-[300px] ${className}`}>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!model) {
    return null;
  }

  return (
    <div className={`relative w-full ${className}`}>
      <iframe
        title={`${exerciseName} 3D Model`}
        src={model.embedUrl}
        className="w-full aspect-video rounded-lg shadow-lg"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
      />
    </div>
  );
} 