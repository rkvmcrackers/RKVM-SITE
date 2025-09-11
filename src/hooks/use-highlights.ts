import { useState, useEffect } from 'react';
import { saveHighlights, getHighlights } from '../utils/github-api';

export const useHighlights = () => {
  const [highlights, setHighlights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        setLoading(true);
        
        // Try to get highlights from GitHub first
        let githubHighlights = await getHighlights();
        
        if (githubHighlights && githubHighlights.length > 0) {
          // Use GitHub highlights
          setHighlights(githubHighlights);
        } else {
          // Fallback to base highlights
          try {
            const response = await fetch('/highlights.json');
            if (response.ok) {
              const baseHighlights = await response.json();
              setHighlights(baseHighlights.highlights);
            } else {
              setHighlights([]);
            }
          } catch (err) {
            console.warn("Error fetching base highlights:", err);
            setHighlights([]);
          }
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch highlights');
        console.error('Error fetching highlights:', err);
        setHighlights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHighlights();
  }, []);

  // Update highlights and save to GitHub
  const updateHighlights = async (newHighlights: string[]) => {
    setHighlights(newHighlights);
    try {
      const success = await saveHighlights(newHighlights);
      if (!success) {
        setError('Failed to save highlights. Please try again.');
        // Revert the local state if save failed
        setHighlights(highlights);
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Error saving highlights to GitHub:', err);
      setError('Failed to save highlights. Please try again.');
      // Revert the local state if save failed
      setHighlights(highlights);
    }
  };

  // Add a new highlight
  const addHighlight = async (highlight: string) => {
    if (highlight.trim()) {
      const newHighlights = [...highlights, highlight.trim()];
      await updateHighlights(newHighlights);
    }
  };

  // Remove a highlight by index
  const removeHighlight = async (index: number) => {
    const newHighlights = highlights.filter((_, i) => i !== index);
    await updateHighlights(newHighlights);
  };

  // Update a highlight by index
  const updateHighlight = async (index: number, newText: string) => {
    if (newText.trim()) {
      const newHighlights = [...highlights];
      newHighlights[index] = newText.trim();
      await updateHighlights(newHighlights);
    }
  };

  // Reset to base highlights
  const resetToBase = async () => {
    try {
      const response = await fetch('/highlights.json');
      if (response.ok) {
        const baseHighlights = await response.json();
        await updateHighlights(baseHighlights.highlights);
      }
    } catch (err) {
      console.error('Error resetting to base highlights:', err);
    }
  };

  return {
    highlights,
    loading,
    error,
    updateHighlights,
    addHighlight,
    removeHighlight,
    updateHighlight,
    resetToBase
  };
};
