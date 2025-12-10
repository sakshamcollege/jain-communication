import { NextResponse } from "next/server";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import path from "path";
import { checkAuth } from "@/lib/api-auth";

// Initialize client
// In production (Vercel), we use environment variables directly
// In local, we can use GOOGLE_APPLICATION_CREDENTIALS file path or these env vars
const getClient = () => {
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return new ImageAnnotatorClient({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_PROJECT_ID,
      },
    });
  }

  // Local Development Fix:
  // If using a file path, ensure it's absolute because relative paths can be flaky in Next.js
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    // If it's already absolute, use it directly
    if (path.isAbsolute(credsPath)) {
      return new ImageAnnotatorClient({
        keyFilename: credsPath
      });
    }
    // Otherwise, resolve it relative to process.cwd()
    return new ImageAnnotatorClient({
      keyFilename: path.join(process.cwd(), credsPath)
    });
  }

  return new ImageAnnotatorClient();
};

const client = getClient();

export async function POST(request: Request) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const base64Image = image.replace(/^data:image\/\w+;base64,/, "");

    // 1. Text Detection (OCR)
    const [textResult] = await client.textDetection({
      image: { content: base64Image },
    });
    const detections = textResult.textAnnotations;
    const fullText = detections?.[0]?.description || "";

    // 2. Label Detection for category/brand hints
    const [labelResult] = await client.labelDetection({
      image: { content: base64Image },
    });
    const labels = labelResult.labelAnnotations?.map((l) => l.description || "") || [];

    // 3. Process Data
    const lines = cleanAndSplitLines(fullText);
    const brand = detectBrand(lines, labels);
    const modelInfo = detectModel(lines, brand);
    const model = modelInfo?.model;
    
    const { ram, storage } = extractRamAndStorage(fullText);
    const imeis = extractImeis(fullText);
    
    const battery = extractBattery(fullText);
    const camera = extractCamera(fullText);
    const refreshRate = extractRefreshRate(fullText);
    const processor = extractChipset(fullText);

    const name = constructProductName(brand, model, ram, storage);
    const specs = buildSpecsBlock({ ram, storage, battery, camera, refreshRate, processor, imeis });
    const description = buildDescription(lines, modelInfo?.line);

    return NextResponse.json({
      success: true,
      data: {
        name,
        description,
        specs,
        detectedLabels: labels,
        brand,
        model,
        ram,
        storage,
        battery,
        camera,
        refreshRate,
        processor,
        imeiList: imeis
      },
    });

  } catch (error) {
    console.error("Vision API Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to analyze image", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// --- Helper Functions ---

const BRANDS = ["samsung","apple","xiaomi","redmi","realme","oppo","vivo","oneplus","nothing","poco","infinix","tecno","nokia","lava","motorola","itel","micromax"];

function cleanAndSplitLines(fullText: string): string[] {
  return fullText
    .split("\n")
    .map(l => l.trim())
    .filter(l => {
      if (l.length < 3) return false;
      const lower = l.toLowerCase();
      if (lower.includes("customer care") || lower.includes("warning") || lower.includes("mrp")) return false;
      // Filter out lines that are just digits/slashes unless they look like RAM/ROM (e.g. 8/128)
      if (/^[\d\/\.\s]+$/.test(l) && !/\d+\/\d+/.test(l)) return false; 
      return true;
    });
}

function detectBrand(lines: string[], labels: string[]): string | undefined {
  // 1. Check lines for brand name
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const brand of BRANDS) {
      if (lowerLine.includes(brand)) {
        // Return formatted brand (capitalize first letter)
        return brand.charAt(0).toUpperCase() + brand.slice(1);
      }
    }
  }
  // 2. Check labels
  for (const label of labels) {
    const lowerLabel = label.toLowerCase();
    for (const brand of BRANDS) {
      if (lowerLabel.includes(brand)) {
        return brand.charAt(0).toUpperCase() + brand.slice(1);
      }
    }
  }
  return undefined;
}

function detectModel(lines: string[], brand?: string): { model: string, line: string } | undefined {
  let bestScore = -100;
  let bestLine = "";

  for (const line of lines) {
    const score = scoreLineForModel(line, brand);
    if (score > bestScore) {
      bestScore = score;
      bestLine = line;
    }
  }

  if (bestScore > 0) {
    // Clean up the model string
    let model = bestLine;
    if (brand) {
        // Remove brand from model line if present to avoid "Samsung Samsung Galaxy..."
        const brandRegex = new RegExp(brand, 'gi');
        model = model.replace(brandRegex, '').trim();
    }
    // Remove common noise words from model line
    model = model.replace(/5g|4g|lte|smartphone|mobile/gi, '').trim();
    return { model, line: bestLine };
  }
  return undefined;
}

function scoreLineForModel(line: string, brand?: string): number {
  let score = 0;
  const lower = line.toLowerCase();

  // +5 if brand is in the line (strong indicator it's the title line)
  if (brand && lower.includes(brand.toLowerCase())) {
    score += 5;
  }

  // +4 for patterns like "C55", "Note 13", "Galaxy S23", "iPhone 14"
  // Alphanumeric with at least one digit, or specific keywords
  if (/\b[a-z]+\s?\d{1,4}[a-z]?\b/i.test(line) || /\b(note|galaxy|iphone|redmi|pro|plus|ultra|max|prime|neo)\b/i.test(line)) {
    score += 4;
  }

  // -3 for noise words that indicate specs or other info
  if (/\b(gb|ram|rom|mah|mp|camera|screen|display|processor|android|ios|battery)\b/i.test(line)) {
    score -= 3;
  }
  
  // Penalize very long lines (likely description)
  if (line.length > 40) score -= 2;

  return score;
}

function extractRamAndStorage(text: string): { ram?: string, storage?: string } {
  let ram: string | undefined;
  let storage: string | undefined;

  // Pattern 1: "8/128", "8GB/128GB"
  const slashMatch = text.match(/(\d{1,2})\s?(?:GB)?\s?\/\s?(\d{2,4})\s?(?:GB)?/i);
  if (slashMatch) {
    ram = slashMatch[1] + "GB";
    storage = slashMatch[2] + "GB";
    return { ram, storage };
  }

  // Pattern 2: Separate "8GB RAM", "128GB Storage/ROM"
  const ramMatch = text.match(/(\d{1,2})\s?GB\s?RAM/i);
  if (ramMatch) ram = ramMatch[1] + "GB";

  const storageMatch = text.match(/(\d{2,4})\s?GB\s?(?:ROM|Storage|Internal)/i);
  if (storageMatch) storage = storageMatch[1] + "GB";

  return { ram, storage };
}

function extractImeis(text: string): string[] {
  const imeis: string[] = [];
  // Look for 15 digit numbers
  const matches = text.matchAll(/\b\d{15}\b/g);
  for (const match of matches) {
    if (!imeis.includes(match[0])) imeis.push(match[0]);
  }
  
  // Look for "IMEI: xxxx"
  const imeiLabelMatches = text.matchAll(/IMEI\s?[:#]?\s?(\d{15})/gi);
  for (const match of imeiLabelMatches) {
    if (!imeis.includes(match[1])) imeis.push(match[1]);
  }

  return imeis.slice(0, 2);
}

function extractBattery(text: string): string | undefined {
  const match = text.match(/(\d{3,5})\s?mAh/i);
  return match ? match[1] + "mAh" : undefined;
}

function extractCamera(text: string): string | undefined {
  // Look for "50MP", "50+2MP", "50 MP AI Camera"
  const match = text.match(/(\d{2,3}(?:\+\d{1,3})*)\s?MP/i);
  return match ? match[1] + "MP" : undefined;
}

function extractRefreshRate(text: string): string | undefined {
  const match = text.match(/(\d{2,3})\s?Hz/i);
  return match ? match[1] + "Hz" : undefined;
}

function extractChipset(text: string): string | undefined {
  const match = text.match(/(Snapdragon|Helio|Dimensity|Exynos|Bionic|Unisoc)\s?[\w\d]+/i);
  return match ? match[0] : undefined;
}

function buildSpecsBlock(data: { ram?: string, storage?: string, battery?: string, camera?: string, refreshRate?: string, processor?: string, imeis: string[] }): string {
  const specs = [];
  if (data.ram && data.storage) specs.push(`Memory: ${data.ram} RAM / ${data.storage} Storage`);
  else if (data.ram) specs.push(`RAM: ${data.ram}`);
  else if (data.storage) specs.push(`Storage: ${data.storage}`);

  if (data.processor) specs.push(`Processor: ${data.processor}`);
  if (data.camera) specs.push(`Camera: ${data.camera}`);
  if (data.battery) specs.push(`Battery: ${data.battery}`);
  if (data.refreshRate) specs.push(`Display: ${data.refreshRate}`);
  
  if (data.imeis.length > 0) {
    specs.push(`IMEI: ${data.imeis.join(", ")}`);
  }

  return specs.join("\n");
}

function constructProductName(brand?: string, model?: string, ram?: string, storage?: string): string {
  const parts = [];
  if (brand) parts.push(brand);
  if (model) parts.push(model);
  if (ram && storage) parts.push(`(${ram}/${storage})`);
  
  return parts.join(" ");
}

function buildDescription(lines: string[], modelLine?: string): string {
  // Filter out the line used for model to avoid duplication at the top
  return lines.filter(l => l !== modelLine).join("\n");
}
