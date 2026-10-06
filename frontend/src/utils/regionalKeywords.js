/**
 * Regional Dialect & Multilingual Voice Search Vocabulary Map
 * Maps spoken terms in Hindi, Tamil, Telugu, Kannada, Bengali, Malayalam, Marathi, Gujarati
 * and Hinglish / Tanglish to canonical catalog keywords.
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', name: 'English (India)', flag: '🇮🇳', nativeName: 'English' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
  { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳', nativeName: 'தமிழ்' },
  { code: 'te-IN', name: 'Telugu', flag: '🇮🇳', nativeName: 'తెలుగు' },
  { code: 'kn-IN', name: 'Kannada', flag: '🇮🇳', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml-IN', name: 'Malayalam', flag: '🇮🇳', nativeName: 'മലയാളം' },
  { code: 'bn-IN', name: 'Bengali', flag: '🇮🇳', nativeName: 'বাংলা' },
  { code: 'mr-IN', name: 'Marathi', flag: '🇮🇳', nativeName: 'मराठी' },
];

/**
 * Dialect and regional phonetic synonyms mapped to catalog search terms.
 */
export const REGIONAL_TERM_MAP = {
  // Drills & Power tools
  'ड्रिल': 'drill',
  'ड्रिल मशीन': 'drill',
  'drill machine': 'drill',
  'டிரில்': 'drill',
  'டிரில் மெஷின்': 'drill',
  'drill venum': 'drill',
  'డ్రిల్': 'drill',
  'డ్రిల్ మెషిన్': 'drill',
  'ಕೊರೆಯುವ ಯಂತ್ರ': 'drill',
  'ড্রিল': 'drill',

  // Water Pumps & Motors
  'पानी मोटर': 'water pump',
  'पानी की मोटर': 'water pump',
  'पानी का पंप': 'water pump',
  'पानी पंप': 'water pump',
  'pani motor': 'water pump',
  'tanni motor': 'water pump',
  'தண்ணீர் மோட்டார்': 'water pump',
  'நீரேற்றி': 'water pump',
  'నీటి మోటార్': 'water pump',
  'నీరు పంప్': 'water pump',
  'ನೀರು ಪಂಪ್': 'water pump',
  'জল পাম্প': 'water pump',
  'पाण्याचा पंप': 'water pump',

  // Ladders
  'सीढ़ी': 'ladder',
  'सीडी': 'ladder',
  'sidhi': 'ladder',
  'ஏணி': 'ladder',
  'ஏணிப்படி': 'ladder',
  'eani': 'ladder',
  'koni': 'ladder',
  'నిచ్చెన': 'ladder',
  'ಏಣಿ': 'ladder',
  'মই': 'ladder',
  'शिडी': 'ladder',

  // Grass Cutters & Lawn Mowers
  'घास काटने की मशीन': 'grass cutter lawn mower',
  'घास कटर': 'grass cutter',
  'grass cutter': 'grass cutter',
  'புல் வெட்டும் இயந்திரம்': 'grass cutter lawn mower',
  'pullu vetti': 'grass cutter',
  'గడ్డి కట్టర్': 'grass cutter',
  'ಹುಲ್ಲು ಕತ್ತರಿಸುವ ಯಂತ್ರ': 'grass cutter',
  'ঘাস কাটার যন্ত্র': 'grass cutter',

  // Pressure Washers & Car Washing
  'गाड़ी धोने की मशीन': 'car washer pressure washer',
  'कार वाशर': 'car washer',
  'vandi wash': 'car washer',
  'கார் வாஷர்': 'car washer',
  'ప్రెజర్ వాషర్': 'pressure washer',
  'ಪ್ರೆಶರ್ ವಾಷರ್': 'pressure washer',
  'গাড়ি ধোয়ার মেশিন': 'car washer',

  // Camping Tents
  'तंबू': 'tent camping',
  'तंबूरा': 'tent',
  'கூடாரம்': 'tent camping',
  'குடாரம்': 'tent',
  'koodaram': 'tent',
  'గుడారం': 'tent',
  'ಡೇರೆ': 'tent',
  'তাঁবু': 'tent',

  // Bicycles
  'साइकिल': 'bicycle cycle',
  'सायकल': 'bicycle',
  'சைக்கிள்': 'bicycle cycle',
  'மிதிவண்டி': 'bicycle',
  'mithivandi': 'bicycle',
  'సైకిల్': 'bicycle',
  'ಸೈಕಲ್': 'bicycle',
  'সাইকেল': 'bicycle',

  // Sewing Machines
  'सिलाई मशीन': 'sewing machine',
  'tailor machine': 'sewing machine',
  'தையல் இயந்திரம்': 'sewing machine',
  'thaiyal machine': 'sewing machine',
  'కుట్టు మిషన్': 'sewing machine',
  'ಹೊಲಿಗೆ ಯಂತ್ರ': 'sewing machine',
  'সেলাই মেশিন': 'sewing machine',

  // Projectors
  'प्रोजेक्टर': 'projector screen',
  'புரொஜெக்டர்': 'projector',
  'திரையரங்கம்': 'projector',
  'ప్రొజెక్టర్': 'projector',
  'ಪ್ರೊಜೆಕ್ಟರ್': 'projector',
  'প্রজেক্টর': 'projector',

  // Cameras & Photography
  'कैमरा': 'camera dslr',
  'फोटो कैमरा': 'camera',
  'கேமரா': 'camera dslr',
  'కెమెరా': 'camera',
  'ಕ್ಯಾಮೆರಾ': 'camera',
  'ক্যামেরা': 'camera',

  // Welding
  'वेल्डिंग मशीन': 'welding machine',
  'वेल्डिंग': 'welding',
  'வெல்டிங்': 'welding',
  'వెల్డింగ్': 'welding',
  'ವೆಲ್ಡಿಂಗ್': 'welding',
  'ওয়েল্ডিং': 'welding',

  // Hammers & Hand Tools
  'हथौड़ा': 'hammer',
  'hathoda': 'hammer',
  'சுத்தி': 'hammer',
  'suthi': 'hammer',
  'సుత్తి': 'hammer',
  'ಸುತ್ತಿಗೆ': 'hammer',
  'হাতুড়ি': 'hammer',

  // Screwdrivers
  'पेचकश': 'screwdriver',
  'pechkash': 'screwdriver',
  'ஸ்க்ரூடிரைவர்': 'screwdriver',
  'స్క్రూడ్రైవర్': 'screwdriver',
  'ಸ್ಕ್ರೂಡ್ರೈವರ್': 'screwdriver',
  'স্ক্রু ড্রাইভার': 'screwdriver',

  // Speakers & Sound
  'स्पीकर': 'speaker audio',
  'सराउंड साउंड': 'speaker',
  'சவுண்ட் பாக்ஸ்': 'speaker',
  'ஸ்பீக்கர்': 'speaker',
  'స్పీకర్': 'speaker',
  'ಸ್ಪೀಕರ್': 'speaker',
  'স্পিকার': 'speaker',

  // Grinders & Mixers
  'ग्राइंडर': 'grinder mixer',
  'मिक्सर': 'mixer grinder',
  'மிக்ஸி': 'mixer grinder',
  'கிரைண்டர்': 'grinder',
  'గ్రైండర్': 'grinder',
  'ಮಿಕ್ಸರ್': 'mixer grinder',
  'গ্রাইন্ডার': 'grinder',

  // Books & Notes
  'किताबें': 'books study',
  'किताब': 'books',
  'புத்தகம்': 'books study',
  'పుస్తకాలు': 'books',
  'ಪುಸ್ತಕಗಳು': 'books',
  'বই': 'books',
};

/**
 * Normalizes spoken voice text and detects mapped English keywords
 * while preserving the original regional query.
 */
export function mapRegionalVoiceToKeywords(spokenText) {
  if (!spokenText || typeof spokenText !== 'string') {
    return {
      original: '',
      mappedKeyword: '',
      matchedTerm: null,
      combinedQuery: '',
    };
  }

  const cleaned = spokenText.trim().toLowerCase();
  
  // 1. Direct match check
  for (const [regionalKey, englishVal] of Object.entries(REGIONAL_TERM_MAP)) {
    if (cleaned === regionalKey.toLowerCase()) {
      return {
        original: spokenText.trim(),
        mappedKeyword: englishVal,
        matchedTerm: regionalKey,
        combinedQuery: `${spokenText.trim()}, ${englishVal}`,
      };
    }
  }

  // 2. Substring match check (e.g. "mujhe drill machine chahiye" -> "drill")
  for (const [regionalKey, englishVal] of Object.entries(REGIONAL_TERM_MAP)) {
    if (cleaned.includes(regionalKey.toLowerCase())) {
      return {
        original: spokenText.trim(),
        mappedKeyword: englishVal,
        matchedTerm: regionalKey,
        combinedQuery: `${spokenText.trim()}, ${englishVal}`,
      };
    }
  }

  // 3. Fallback: clean words
  return {
    original: spokenText.trim(),
    mappedKeyword: spokenText.trim(),
    matchedTerm: null,
    combinedQuery: spokenText.trim(),
  };
}
