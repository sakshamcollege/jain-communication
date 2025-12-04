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
    const lines = fullText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    
    // List of common mobile brands to help identify the name
    const brands = [
      "Samsung", "Apple", "iPhone", "Xiaomi", "Redmi", "Realme", "Vivo", "Oppo", 
      "OnePlus", "Motorola", "Nokia", "Google", "Pixel", "Techno", "Infinix", 
      "Itel", "Poco", "iQOO", "Nothing", "Lava", "Micromax", "Honor", "Huawei", 
      "Sony", "LG", "Asus", "Lenovo", "Narzo"
    ];
    
    // 1. Try to find a line containing a brand name
    let potentialName = lines.find(line => 
      brands.some(brand => line.toLowerCase().includes(brand.toLowerCase()))
    );

    // 2. If no brand line found, check if any detected label is a brand
    if (!potentialName) {
        const brandLabel = labels.find(label => brands.some(b => b.toLowerCase() === label?.toLowerCase()));
        if (brandLabel) {
            // If first line doesn't already have the brand, prepend it
            if (!lines[0]?.toLowerCase().includes(brandLabel.toLowerCase())) {
                 potentialName = `${brandLabel} ${lines[0] || ""}`;
            } else {
                 potentialName = lines[0];
            }
        }
    }

    // 3. Fallback: Use the first line if it's not a spec keyword or garbage
    if (!potentialName) {
        const skipKeywords = ["GB", "RAM", "ROM", "mAh", "Camera", "MP", "Screen", "Display", "Processor", "Snapdragon", "Helios", "Dimensity", "Battery", "Volt", "Watt", "Specification", "Features", "Warning"];
        if (lines[0] && !skipKeywords.some(k => lines[0].includes(k)) && lines[0].length > 2) {
            potentialName = lines[0];
        }
    }

    // Extract Specs
    const specKeywords = ["GB", "RAM", "ROM", "mAh", "Camera", "MP", "Screen", "Display", "Processor", "Snapdragon", "Helios", "Dimensity", "Hz", "AMOLED", "LCD", "Core", "Android", "iOS", "5G", "4G"];
    const potentialSpecs = lines
      .filter(line => specKeywords.some(keyword => line.includes(keyword)))
      .join("\n");

    // Create Description (Cleaned up full text)
    // Filter out very short lines which are often OCR noise
    const description = lines.filter(l => l.length > 3).join("\n");

    return NextResponse.json({
      success: true,
      data: {
        name: potentialName || "", // Return empty if we couldn't find a good name
        description: description,
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
