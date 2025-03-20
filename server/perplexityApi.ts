import { Event, SearchParams } from "@shared/schema";
import { storage } from "./storage";
import crypto from "crypto";

// Perplexity API key from environment
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

if (!PERPLEXITY_API_KEY) {
  console.warn("PERPLEXITY_API_KEY is not set. API calls will fail.");
}

interface PerplexityResponse {
  id: string;
  model: string;
  choices: {
    message: {
      content: string;
    };
  }[];
}

// Fetch events from Perplexity API
export async function fetchEvents(params: SearchParams): Promise<Event[]> {
  try {
    // Format the query for Perplexity
    const dateFrom = new Date(params.dateFrom).toISOString().split('T')[0];
    const dateTo = new Date(params.dateTo).toISOString().split('T')[0];

    // Get district name if provided
    let districtName = "";
    if (params.district) {
      const district = await storage.getDistrictByValue(params.district);
      if (district) {
        districtName = district.nameJa;
      }
    }

    // Build the query
    const query = `
      東京都のイベント情報を網羅的に検索します。できるだけ多くのイベント（少なくとも20-30個、可能であれば50-60個）を見つけてください。
      日付範囲: ${dateFrom} から ${dateTo} まで
      ${districtName ? `地域: ${districtName}` : '全地域'}
      
      対象となるイベントタイプ:
      - コンサート、ライブ、音楽フェスティバル
      - 美術展、博物館特別展示
      - 伝統的な日本の祭り、イベント
      - 食のイベント、グルメフェスティバル
      - スポーツイベント
      - ポップカルチャーイベント（アニメ、ゲーム関連）
      - マーケット、フリーマーケット
      - ワークショップ、セミナー
      - 季節の行事（花見、紅葉狩りなど）
      - 展示会、見本市
      
      以下の形式でJSONデータとして返してください。できるだけ多くのイベントを含めてください:
      [
        {
          "id": "一意のID",
          "titleJa": "イベントタイトル（日本語）",
          "titleEn": "イベントタイトル（英語）",
          "descriptionJa": "イベント説明（日本語）",
          "descriptionEn": "イベント説明（英語）",
          "startDate": "開始日 (YYYY-MM-DD)",
          "endDate": "終了日 (YYYY-MM-DD)、1日のみの場合はnull",
          "location": "開催場所",
          "district": "地区",
          "imageUrl": "イベント画像URL"
        },
        ...
      ]
      
      レスポンスは正しいJSONオブジェクトの配列である必要があります。他の文章は不要です。
      最大限のイベント数を提供してください。
    `;

    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides accurate information about events in Tokyo, Japan. Your responses should be in valid JSON format when requested. Provide as many events as possible, aiming for at least 30-50 events in your response.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data: PerplexityResponse = await response.json();

    // Parse the JSON response from the content
    const content = data.choices[0]?.message.content;
    if (!content) {
      throw new Error('No content in Perplexity API response');
    }

    // Try to extract JSON array from content (in case there's text surrounding it)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Perplexity API response');
    }

    const events: Event[] = JSON.parse(jsonMatch[0]);

    // Cache events in storage for future use
    storage.cacheEvents(events);

    return events;
  } catch (error) {
    console.error('Error fetching events from Perplexity:', error);
    throw new Error('Failed to fetch events. Please try again later.');
  }
}

// Fetch a single event by ID
export async function fetchEventById(eventId: string): Promise<Event | null> {
  try {
    // Build the query for Perplexity
    const query = `
      以下のIDを持つ東京のイベント情報を詳細に教えてください: ${eventId}
      
      以下の形式でJSONデータとして返してください:
      {
        "id": "${eventId}",
        "titleJa": "イベントタイトル（日本語）",
        "titleEn": "イベントタイトル（英語）",
        "descriptionJa": "イベント説明（日本語、詳細に）",
        "descriptionEn": "イベント説明（英語、詳細に）",
        "startDate": "開始日 (YYYY-MM-DD)",
        "endDate": "終了日 (YYYY-MM-DD)、1日のみの場合はnull",
        "location": "開催場所",
        "district": "地区",
        "imageUrl": "イベント画像URL"
      }
      
      レスポンスは正しいJSONオブジェクトである必要があります。他の文章は不要です。
      イベントIDに該当する情報が見つからない場合は、東京の人気イベントについての情報を代わりに提供し、そのイベントに与えられたIDを "${eventId}" としてください。
    `;

    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides accurate and detailed information about events in Tokyo, Japan. Your responses should be in valid JSON format when requested. Provide rich, detailed descriptions for event details.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data: PerplexityResponse = await response.json();

    // Parse the JSON response from the content
    const content = data.choices[0]?.message.content;
    if (!content) {
      throw new Error('No content in Perplexity API response');
    }

    // Try to extract JSON object from content
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Perplexity API response');
    }

    const event: Event = JSON.parse(jsonMatch[0]);

    // Cache the event
    storage.cacheEvent(event);

    return event;
  } catch (error) {
    console.error('Error fetching event from Perplexity:', error);
    throw new Error('Failed to fetch event details. Please try again later.');
  }
}

// Generate a random event with the given ID (fallback)
export function generateRandomEvent(id: string): Event {
  const titles = [
    { ja: '東京タワー サマーフェスティバル', en: 'Tokyo Tower Summer Festival' },
    { ja: '現代アート展：未来への視点', en: 'Contemporary Art Exhibition: Perspectives on the Future' },
    { ja: '渋谷ジャズナイト', en: 'Shibuya Jazz Night' },
    { ja: '東京グルメフェスティバル', en: 'Tokyo Gourmet Festival' },
    { ja: '神田祭り', en: 'Kanda Festival' },
  ];
  
  const locations = [
    '東京タワー (港区)',
    '東京国立新美術館 (六本木)',
    '渋谷区 - 複数会場',
    '代々木公園',
    '神田神社周辺 (千代田区)',
  ];
  
  const districts = [
    'central',
    'shinjuku-shibuya',
    'ikebukuro-ueno',
    'south',
    'north-east',
  ];
  
  const images = [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80',
    'https://images.unsplash.com/photo-1565204261939-e410a1e56ec1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80',
    'https://images.unsplash.com/photo-1560439513-74b037a25d84?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80',
  ];
  
  const descriptions = [
    { 
      ja: '東京タワーで開催される夏の風物詩、サマーフェスティバル。イルミネーション、フードブース、ライブパフォーマンスなど、様々なアクティビティをお楽しみいただけます。', 
      en: 'A summer tradition at Tokyo Tower featuring illuminations, food stalls, live performances, and various activities for all ages.' 
    },
    { 
      ja: '日本と海外のアーティスト50名以上が集結する大規模な現代アート展。テクノロジーと芸術の融合をテーマにした作品を展示します。', 
      en: 'A major contemporary art exhibition featuring over 50 artists from Japan and abroad, showcasing works that explore the fusion of technology and art.' 
    },
    { 
      ja: '渋谷区内の複数の会場で行われるジャズフェスティバル。国内外の一流ミュージシャンによるパフォーマンスを3日間にわたりお楽しみいただけます。', 
      en: 'A jazz festival held at multiple venues across Shibuya, featuring performances by top musicians from Japan and abroad over three days.' 
    },
    { 
      ja: '東京の人気レストランや屋台が集結する、年に一度の食の祭典。世界各国の料理や日本各地の郷土料理など、様々な味を一度に楽しめます。', 
      en: 'An annual food festival featuring popular Tokyo restaurants and food stalls. Enjoy a variety of cuisines from around the world and regional Japanese dishes all in one place.' 
    },
    { 
      ja: '江戸三大祭りの一つ、神田祭り。絢爛豪華な山車や神輿が町中を練り歩く様子は、日本の伝統文化を体験できる貴重な機会です。', 
      en: 'One of the three major festivals of Edo, the Kanda Festival features elaborate floats and portable shrines parading through the streets, offering a valuable opportunity to experience traditional Japanese culture.' 
    },
  ];
  
  // Create a random index but based on the eventId to maintain consistency
  const seed = crypto.createHash('md5').update(id).digest('hex');
  const index = parseInt(seed.substring(0, 8), 16) % titles.length;
  
  // Generate random dates between today and 3 months from now
  const today = new Date();
  const future = new Date();
  future.setMonth(future.getMonth() + 3);
  
  const startDateNum = today.getTime() + Math.random() * (future.getTime() - today.getTime());
  const startDate = new Date(startDateNum);
  
  // 50% chance of multi-day event
  const hasEndDate = Math.random() > 0.5;
  let endDate = null;
  if (hasEndDate) {
    const endDateNum = startDateNum + (1 + Math.floor(Math.random() * 7)) * 24 * 60 * 60 * 1000; // 1-7 days later
    endDate = new Date(endDateNum).toISOString().split('T')[0];
  }
  
  return {
    id,
    titleJa: titles[index].ja,
    titleEn: titles[index].en,
    descriptionJa: descriptions[index].ja,
    descriptionEn: descriptions[index].en,
    startDate: startDate.toISOString().split('T')[0],
    endDate,
    location: locations[index],
    district: districts[index],
    imageUrl: images[index],
  };
}
