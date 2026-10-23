/**
 * Centralised Gemini AI Service Module.
 * All AI interactions (practice feedback, chord recommendations, lyric assistance)
 * are routed through this single module so keys can seamlessly transition
 * to a backend proxy route (/api/*) when deploying.
 */

import { GoogleGenAI } from '@google/genai';

class GeminiCoachService {
  private client: GoogleGenAI | null = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
    if (apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.warn('Failed to initialise GoogleGenAI client:', err);
      }
    }
  }

  /**
   * Explains performance mistakes and gives motivational advice in British English.
   */
  async explainMistakes(sessionData: {
    lessonTitle: string;
    accuracy: number;
    wrongNotes: string[];
    timingRating: string;
  }): Promise<string> {
    if (this.client) {
      try {
        const response = await this.client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are Ru, a friendly and encouraging British piano teacher and music producer.
Review this practice session for the lesson "${sessionData.lessonTitle}":
- Accuracy: ${sessionData.accuracy}%
- Missed or hesitating notes: ${sessionData.wrongNotes.join(', ') || 'None'}
- Timing verdict: ${sessionData.timingRating}

Provide a short, constructive 2-3 sentence tip in British English on how the student can refine their finger movement and rhythm.`,
        });
        if (response.text) return response.text;
      } catch (e) {
        console.warn('Gemini request failed, providing pedagogical advice:', e);
      }
    }

    // Default pedagogical responses in British English
    if (sessionData.accuracy >= 90) {
      return "Superb playing! Your timing is crisp and your finger placement is spot on. Ready to advance to the next progression or try writing a melody!";
    } else if (sessionData.accuracy >= 70) {
      return "Good effort! Try relaxing your wrists and keeping your fingers gently curved like holding an apple. Let's practise the transitions at 75% tempo.";
    } else {
      return "Steady on—learning keyboard geography takes time. Focus on finding Middle C first with finger 1, then let your fingers rest naturally on adjacent white keys.";
    }
  }

  /**
   * Generates chord progression and bass ideas in the user's selected key.
   */
  async suggestChordsAndBass(key: string, mood: string): Promise<{ chords: string[]; bassLine: string; explanation: string }> {
    if (this.client) {
      try {
        const response = await this.client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Suggest a 4-chord progression and walking or 808 bass motif in the key of ${key} with a ${mood} vibe for an iPhone beatmaker.
Format JSON only with keys: chords (array of 4 chord names), bassLine (text description of root notes), explanation (1 sentence).`,
        });
        const text = response.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('Gemini chord suggestion fallback:', e);
      }
    }

    // Fallback chord ideas
    return {
      chords: ['Cmaj7', 'Am7', 'Dm7', 'G7'],
      bassLine: 'C2 on beat 1, A1 on beat 5, D2 on beat 9, G1 on beat 13',
      explanation: 'A classic British pop/jazz progression (I-vi-ii-V) providing a warm, melodic foundation.',
    };
  }
}

export const geminiCoach = new GeminiCoachService();
