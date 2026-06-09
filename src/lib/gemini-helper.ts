import { GoogleGenerativeAI } from '@google/generative-ai';
// Force Next.js dev server recompilation - touch gemini-helper.ts
import { GoogleAIFileManager } from '@google/generative-ai/server';

export interface ScriptSegment {
  start: number;
  end: number;
  originalText: string;
  translatedText: string;
}

export async function transcribeAndTranslate(
  apiKey: string,
  filePath: string,
  mimeType: string = 'audio/mp3'
): Promise<ScriptSegment[]> {
  const fileManager = new GoogleAIFileManager(apiKey);
  const genAI = new GoogleGenerativeAI(apiKey);

  console.log(`Uploading file ${filePath} to Gemini File API...`);
  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName: 'Transcription audio',
  });

  const fileName = uploadResult.file.name;
  console.log(`Uploaded file. Name: ${fileName}. Waiting for it to become ACTIVE...`);

  // Wait for file processing to complete
  let fileInfo = await fileManager.getFile(fileName);
  let attempts = 0;
  const maxAttempts = 30; // 60 seconds max wait
  
  while (fileInfo.state === 'PROCESSING' && attempts < maxAttempts) {
    console.log('Gemini File API processing... waiting 2s');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    fileInfo = await fileManager.getFile(fileName);
    attempts++;
  }

  if (fileInfo.state !== 'ACTIVE') {
    // Attempt cleanup before throwing
    try {
      await fileManager.deleteFile(fileName);
    } catch {}
    throw new Error(`Gemini File API file processing did not succeed. Final state: ${fileInfo.state}`);
  }

  console.log('File is ACTIVE. Generating transcription & translation...');

  const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError: any = null;
  let text = '';

  try {
    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting generation with model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
        });

        const prompt = `
          Analyze this audio file. Transcribe the dialogue with precise timestamps, and translate the dialogue into natural, fluent Korean. 
          Create a timeline script of the dialogue.
          Provide the result in the exact JSON format specified by the response schema.
        `;

        const response = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  fileData: {
                    mimeType: fileInfo.mimeType,
                    fileUri: fileInfo.uri,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'ARRAY' as any,
              description: 'A list of dialog segments with timestamps and translations',
              items: {
                type: 'OBJECT' as any,
                properties: {
                  start: {
                    type: 'NUMBER' as any,
                    description: 'The start time of the segment in seconds (e.g. 1.25)',
                  },
                  end: {
                    type: 'NUMBER' as any,
                    description: 'The end time of the segment in seconds (e.g. 5.10)',
                  },
                  originalText: {
                    type: 'STRING' as any,
                    description: 'The original transcribed text in the language spoken in the video',
                  },
                  translatedText: {
                    type: 'STRING' as any,
                    description: 'The translated Korean text of the segment, naturally phrased.',
                  },
                },
                required: ['start', 'end', 'originalText', 'translatedText'],
              },
            },
          },
        });

        text = response.response.text();
        console.log(`Gemini response successful with model: ${modelName}. Raw response length: ${text.length}`);
        break; // Success, break loop
      } catch (e: any) {
        console.warn(`Model ${modelName} failed:`, e.message || e);
        lastError = e;
      }
    }

    if (!text) {
      throw new Error(`Google Generative AI failed on all attempted models. Last error: ${lastError?.message || lastError}`);
    }

    const segments: ScriptSegment[] = JSON.parse(text);
    return segments;
  } finally {
    // Always cleanup the file from Gemini File API
    console.log(`Cleaning up remote file: ${fileName}`);
    try {
      await fileManager.deleteFile(fileName);
      console.log('Remote file deleted successfully.');
    } catch (e) {
      console.error(`Failed to delete remote file: ${fileName}`, e);
    }
  }
}
