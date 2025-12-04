import { NextResponse } from "next/server";
import { ImageAnnotatorClient } from "@google-cloud/vision";

// Initialize client
// Ensure you set GOOGLE_APPLICATION_CREDENTIALS in your .env file pointing to your json key
// Example: GOOGLE_APPLICATION_CREDENTIALS="./google-credentials.json"
const client = new ImageAnnotatorClient();

export async function POST(request: Request) {
  try {
    const { image } = await request.json(); // Expecting base64 string

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Remove data:image/jpeg;base64, prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, "");

    // 1. Text Detection (OCR) for specs and description
    const [textResult] = await client.textDetection({
      image: { content: base64Image },
    });
    const detections = textResult.textAnnotations;
    const fullText = detections?.[0]?.description || "";

    // 2. Label Detection for category/brand hints
    const [labelResult] = await client.labelDetection({
      image: { content: base64Image },
    });
    const labels = labelResult.labelAnnotations?.map((l) => l.description) || [];

    // Simple parsing logic (You can make this smarter with Regex)
    const lines = fullText.split("\n");
    
    // Heuristic: First line often contains Brand/Model
    const potentialName = lines[0] || "";
    
    // Heuristic: Look for lines with numbers and keywords for specs
    const specKeywords = ["GB", "RAM", "ROM", "mAh", "Camera", "MP", "Screen", "Display", "Processor", "Snapdragon", "Helios"];
    const potentialSpecs = lines
      .filter(line => specKeywords.some(keyword => line.includes(keyword)))
      .join("\n");

    return NextResponse.json({
      success: true,
      data: {
        name: potentialName,
        description: fullText, // Full text as description for now
        specs: potentialSpecs,
        detectedLabels: labels,
      },
    });

  } catch (error) {
    console.error("Vision API Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
