/**
 * Centralised Gemini AI Service Module.
 * All AI interactions (practice feedback, chord recommendations, lyric assistance)
 * are routed through this single module so keys can seamlessly transition
 * to a backend proxy route (/api/*) when deploying.
 */

import { GoogleGenAI } from '@google/genai';
import { SessionTelemetry } from './performanceGrader.ts';

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
   * Analyzes structured session telemetry and returns an encouraging 2-3 sentence coaching critique.
   */
  async analyzeSessionTelemetry(telemetry: SessionTelemetry): Promise<string> {
    if (this.client) {
      try {
        const weakBarsStr = telemetry.weakBars.length > 0
          ? `Weak bars: ${telemetry.weakBars.map((b) => `Bar ${b}`).join(', ')}`
          : 'None (consistent performance across all bars)';
        const accidentalsStr = telemetry.missedAccidentals.length > 0
          ? `Missed accidentals: ${telemetry.missedAccidentals.join(', ')}`
          : 'None';

        const prompt = `You are Ru, an expert British piano coach and modern music producer.
Review this student session telemetry for "${telemetry.songOrLessonTitle}":
- Practice Mode: ${telemetry.mode === 'tempo' ? `Tempo Mode (${telemetry.bpm} BPM)` : 'Smart Wait Mode'}
- Overall Accuracy: ${telemetry.accuracyPercent}%
- Timing breakdown: Perfect: ${telemetry.timingBreakdown.perfect}, Good: ${telemetry.timingBreakdown.good}, Early: ${telemetry.timingBreakdown.early}, Late: ${telemetry.timingBreakdown.late}, Missed: ${telemetry.timingBreakdown.missed}
- Average Hesitation: ${telemetry.averageHesitationMs}ms
- ${weakBarsStr}
- ${accidentalsStr}

Give an encouraging, pedagogical critique in 2-3 concise sentences in British English.
Identify why a transition in the weak bars may have faltered (e.g. finger thumb-under crossing or sharp accidental reach), recommend a specific hand posture adjustment, and suggest the ideal next step (e.g. looping the weak bars at 60% tempo).`;

        const response = await this.client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        if (response.text) return response.text.trim();
      } catch (err) {
        console.warn('Gemini telemetry critique fallback:', err);
      }
    }

    // High quality deterministic fallback in British English
    if (telemetry.accuracyPercent >= 90) {
      return `Brilliant execution across "${telemetry.songOrLessonTitle}"! Your finger rhythm was delightfully synchronised with minimal hesitation. Ready to increase tempo by 10% or add the left-hand bass progression!`;
    } else if (telemetry.weakBars.length > 0) {
      const firstWeak = telemetry.weakBars[0];
      return `Solid work overall (${telemetry.accuracyPercent}%), though Bar ${firstWeak} threw off your momentum. Keep your wrist supple and anticipate the finger shift a beat earlier. Try looping Bar ${firstWeak} at 60% tempo before running the whole piece again.`;
    } else if (telemetry.missedAccidentals.length > 0) {
      return `Great steady tempo! Notice how ${telemetry.missedAccidentals.join(', ')} requires your finger to curve slightly forward onto the black key. Keep your knuckle arch high so you don't catch the neighbouring white key.`;
    } else {
      return `Good effort! You're building solid keyboard muscle memory. Keep your fingers gently curved like resting on a tennis ball and take the transitions at a relaxed 60% pace.`;
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
          model: 'gemini-3.8-flash',
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
          model: 'gemini-3.8-flash',
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
