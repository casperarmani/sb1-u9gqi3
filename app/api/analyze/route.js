import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
});

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('video');

  if (!file) {
    return new Response(JSON.stringify({ message: 'Video file is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Upload the file using the File API
    const uploadResponse = await fileManager.uploadFile(await file.arrayBuffer(), {
      mimeType: file.type,
      displayName: file.name,
    });

    // Wait for the file to be processed
    let uploadedFile = await fileManager.getFile(uploadResponse.file.name);
    while (uploadedFile.state === 'PROCESSING') {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
      uploadedFile = await fileManager.getFile(uploadResponse.file.name);
    }

    if (uploadedFile.state === 'FAILED') {
      throw new Error('Video processing failed');
    }

    // Generate content using the uploaded video
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadedFile.mimeType,
          fileUri: uploadedFile.uri
        }
      },
      { text: "Analyze this video. Provide insights on its content, key messages, and overall effectiveness." },
    ]);

    const analysis = result.response.text();

    // Clean up: delete the uploaded file
    await fileManager.deleteFile(uploadedFile.name);

    return new Response(JSON.stringify({ analysis }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error analyzing video:', error);
    return new Response(JSON.stringify({ message: 'Error analyzing video', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}