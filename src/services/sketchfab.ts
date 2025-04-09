import { cache } from 'react';

export interface SketchfabModel {
  uid: string;
  name: string;
  thumbnailUrl: string;
  embedUrl: string;
  description: string;
}

const SKETCHFAB_API_URL = 'https://api.sketchfab.com/v3';
const API_KEY = process.env.NEXT_PUBLIC_SKETCHFAB_API_KEY;

export class SketchfabError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SketchfabError';
  }
}

export const searchExerciseModels = cache(async (exerciseName: string): Promise<SketchfabModel[]> => {
  if (!API_KEY) {
    throw new SketchfabError('Sketchfab API key is not configured');
  }

  try {
    const searchQuery = `${exerciseName} exercise fitness`;
    const response = await fetch(
      `${SKETCHFAB_API_URL}/search?type=models&q=${encodeURIComponent(searchQuery)}`,
      {
        headers: {
          'Authorization': `Token ${API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new SketchfabError(`Sketchfab API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.results.map((model: any) => ({
      uid: model.uid,
      name: model.name,
      thumbnailUrl: model.thumbnails.images[0].url,
      embedUrl: `https://sketchfab.com/models/${model.uid}/embed`,
      description: model.description,
    })).slice(0, 5); // Limit to 5 results per exercise
  } catch (error) {
    console.error('Error fetching Sketchfab models:', error);
    throw error instanceof SketchfabError ? error : new SketchfabError('Failed to fetch exercise models');
  }
});

export const getModelViewer = (uid: string) => {
  if (!uid) return null;
  
  return `https://sketchfab.com/models/${uid}/embed?autostart=1&ui_controls=1&ui_infos=1&ui_inspector=1&ui_stop=1&ui_watermark=1&ui_watermark_link=1`;
}; 