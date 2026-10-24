"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "hi" | "gu";

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    hi: string;
    gu: string;
  };
}

export const translations: TranslationDictionary = {
  // Navigation
  navPlatform: { en: "Platform", hi: "प्लेटफ़ॉर्म", gu: "પ્લેટફોર્મ" },
  navFeatures: { en: "Features", hi: "विशेषताएं", gu: "સુવિધાઓ" },
  navAiEngine: { en: "AI Engine", hi: "AI इंजन", gu: "AI એન્જિન" },
  navPricing: { en: "Pricing & Packages", hi: "मूल्य निर्धारण और पैकेज", gu: "કિંમતો અને પેકેજ" },
  navDocs: { en: "API Docs", hi: "API दस्तावेज़", gu: "API દસ્તાવેજો" },
  navConsole: { en: "Admin OS", hi: "एडमिन ओएस", gu: "એડમિન OS" },
  navParticipant: { en: "Team Portal", hi: "टीम पोर्टल", gu: "ટીમ પોર્ટલ" },
  navJudge: { en: "Jury Pad", hi: "जूरी पैड", gu: "જ્યુરી પેડ" },
  navVisitor: { en: "Explore Feed", hi: "एक्सप्लोर फ़ीड", gu: "એક્સપ્લોર ફીડ" },
  navGate: { en: "Gate QR", hi: "गेट क्यूआर", gu: "ગેટ QR" },
  navCert: { en: "Certificates", hi: "प्रमाणपत्र", gu: "પ્રમાણપત્રો" },
  navCheckin: { en: "Check-in Scanner", hi: "चेक-इन स्कैनर", gu: "ચેક-ઇન સ્કેનર" },
  navSponsor: { en: "Sponsor Hub", hi: "प्रायोजक हब", gu: "સ્પોન્સર હબ" },
  navLogin: { en: "Sign In", hi: "साइन इन करें", gu: "સાઇન ઇન કરો" },
  navLogout: { en: "Sign Out", hi: "साइन आउट", gu: "સાઇન આઉટ" },

  // Hero & General
  heroTitle1: { en: "Every event.", hi: "प्रत्येक इवेंट।", gu: "દરેક ઇવેન્ટ." },
  heroTitle2: { en: "One intelligent system.", hi: "एक बुद्धिमान प्रणाली।", gu: "એક બુદ્ધિશાળી સિસ્ટમ." },
  heroSubtitle: {
    en: "From registration and QR check-in to live judging, visitor insights, and certificates — manage your entire event in one place.",
    hi: "पंजीकरण और क्यूआर चेक-इन से लेकर लाइव मूल्यांकन, दर्शक अंतर्दृष्टि और प्रमाण पत्र तक — अपने पूरे इवेंट को एक ही स्थान पर प्रबंधित करें।",
    gu: "રજીસ્ટ્રેશન અને QR ચેક-ઇનથી લઈને લાઇવ મૂલ્યાંકન, મુલાકાતી આંતરદ્રષ્ટિ અને પ્રમાણપત્રો સુધી — તમારી આખી ઇવેન્ટ એક જ જગ્યાએ મેનેજ કરો.",
  },
  ctaExplore: { en: "Explore Platform", hi: "प्लेटफ़ॉर्म एक्सप्लोर करें", gu: "પ્લેટફોર્મ એક્સપ્લોર કરો" },
  ctaDemo: { en: "View Live Demo", hi: "लाइव डेमो देखें", gu: "લાઇવ ડેમો જુઓ" },
  ctaRegister: { en: "Register Project", hi: "प्रोजेक्ट रजिस्टर करें", gu: "પ્રોજેક્ટ રજીસ્ટર કરો" },

  // Pricing
  pricingTitle: { en: "Transparent Event Packages", hi: "पारदर्शी इवेंट पैकेज", gu: "પારદર્શક ઇવેન્ટ પેકેજીસ" },
  pricingSubtitle: {
    en: "Choose the perfect intelligence tier for your hackathon, expo, or summit.",
    hi: "अपने हैकथॉन, एक्सपो या शिखर सम्मेलन के लिए उपयुक्त इंटेलिजेंस टियर चुनें।",
    gu: "તમારા હેકાથોન, એક્સ્પો અથવા સમિટ માટે સંપૂર્ણ ઇન્ટેલિજન્સ ટાયર પસંદ કરો.",
  },
  perEvent: { en: "Per Event Pass", hi: "प्रति इवेंट पास", gu: "ઇવેન્ટ દીઠ પાસ" },
  annualUnlimited: { en: "Annual Unlimited", hi: "वार्षिक असीमित", gu: "વાર્ષિક અનલિમિટેડ" },
  popularTier: { en: "Most Popular", hi: "सबसे लोकप्रिय", gu: "સૌથી લોકપ્રિય" },
  getStarted: { en: "Get Started Free", hi: "निःशुल्क प्रारंभ करें", gu: "મફતમાં શરૂ કરો" },
  launchGrowth: { en: "Launch Pro Event", hi: "प्रो इवेंट शुरू करें", gu: "પ્રો ઇવેન્ટ શરૂ કરો" },
  contactEnterprise: { en: "Deploy Enterprise", hi: "एंटरप्राइज़ तैनात करें", gu: "એન્ટરપ્રાઇઝ ગોઠવો" },

  save25: { en: "Save 25%", hi: "25% छूट", gu: "25% બચાવો" },

  // Features Section
  featuresPill: { en: "CORE CAPABILITIES", hi: "मुख्य क्षमताएं", gu: "મુખ્ય ક્ષમતાઓ" },
  featuresHeading: { en: "Four pillars for seamless event operations.", hi: "निर्बाध इवेंट संचालन के चार मुख्य स्तंभ।", gu: "સીમલેસ ઇવેન્ટ કામગીરી માટે ચાર સ્તંભો." },
  featuresSubheading: {
    en: "Every workflow is unified into one configurable platform so organizers, participants, and judges work in sync.",
    hi: "प्रत्येक कार्यप्रणाली को एक मंच पर एकीकृत किया गया है ताकि आयोजक, प्रतिभागी और निर्णायक मिलकर काम कर सकें।",
    gu: "દરેક પ્રક્રિયા એક પ્લેટફોર્મ પર એકીકૃત છે જેથી આયોજકો, સહભાગીઓ અને નિર્ણાયકો સાથે મળીને કામ કરે.",
  },
  feat1Title: { en: "Event Registration & QR Check-in", hi: "इवेंट पंजीकरण और क्यूआर चेक-इन", gu: "ઇવેન્ટ રજીસ્ટ્રેશન અને QR ચેક-ઇન" },
  feat1Desc: {
    en: "90-second onboarding for student teams and startups. Auto-assigns booth stall IDs, generates digital gate passes, and handles entry validation in under 5ms.",
    hi: "छात्र टीमों और स्टार्टअप्स के लिए त्वरित 90-सेकंड ऑनबोर्डिंग। स्वचालित स्टॉल आईडी और 5ms के भीतर प्रवेश सत्यापन।",
    gu: "વિદ્યાર્થી ટીમો અને સ્ટાર્ટઅપ્સ માટે 90-સેકન્ડનું ઓનબોર્ડિંગ. ઓટો સ્ટોલ ફાળવણી અને ઝડપી QR એન્ટ્રી.",
  },
  feat2Title: { en: "Live Judging & Judge Allocation", hi: "लाइव मूल्यांकन और जूरी आवंटन", gu: "લાઇવ મૂલ્યાંકન અને જ્યુરી ફાળવણી" },
  feat2Desc: {
    en: "Multi-criteria rubrics tailored to your event type. Evaluators score projects from any phone or laptop with scores instantly streaming to real-time leaderboards.",
    hi: "विशिष्ट इवेंट प्रकार के लिए बहु-मानदंड रूब्रिक्स। निर्णायक मोबाइल से स्कोर दर्ज करते हैं जो सीधे लीडरबोर्ड पर दिखता है।",
    gu: "તમારી ઇવેન્ટ અનુસાર મૂલ્યાંકન માપદંડ. નિર્ણાયકો મોબાઇલથી સ્કોરિંગ કરે છે જે સીધા લીડરબોર્ડ પર દેખાય છે.",
  },
  feat3Title: { en: "Visitor Analytics & Live Feed", hi: "आगंतुक विश्लेषण और लाइव फ़ीड", gu: "મુલાકાતી એનાલિટિક્સ અને લાઇવ ફીડ" },
  feat3Desc: {
    en: "Every booth receives a dynamic QR badge. Attendees scan to inspect demo links, record stall dwell time, and cast audience choice votes without downloading an app.",
    hi: "प्रत्येक स्टॉल के पास डायनामिक क्यूआर बैज होता है। दर्शक बिना ऐप डाउनलोड किए स्टॉल स्कैन और वोट कर सकते हैं।",
    gu: "દરેક સ્ટોલ માટે ડાયનામિક QR બેજ. એપ ડાઉનલોડ કર્યા વિના સ્ટોલ સ્કેન કરો અને દર્શક વોટ આપો.",
  },
  feat4Title: { en: "Cryptographic Certificate Studio", hi: "क्रिप्टोग्राफिक प्रमाणपत्र स्टूडियो", gu: "ક્રિપ્ટોગ્રાફિક પ્રમાણપત્ર સ્ટુડિયો" },
  feat4Desc: {
    en: "Tamper-proof digital credentials issued in seconds. Embedded with SHA-256 cryptographic hashes and scannable QR verification.",
    hi: "सेकंडों में डिजिटल प्रमाण पत्र जारी करें। SHA-256 क्रिप्टोग्राफ़िक हैश और सत्यापन क्यूआर कोड से सुरक्षित।",
    gu: "સેકંડમાં સુરક્ષિત ડિજિટલ પ્રમાણપત્રો જારી કરો. SHA-256 હેશ અને ચકાસણી QR કોડ સાથે.",
  },

  // AI Section
  aiPill: { en: "INTELLIGENT AUTOMATION", hi: "बुद्धिमान स्वचालन", gu: "બુદ્ધિશાળી ઓટોમેશન" },
  aiHeading: { en: "Purpose-built AI for event fairness and speed.", hi: "इवेंट निष्पक्षता और गति के लिए विशेष AI।", gu: "ઇવેન્ટની નિષ્પક્ષતા અને ઝડપ માટે ખાસ AI." },
  aiSubheading: {
    en: "Implemented algorithms specifically designed to eliminate scheduling friction, judge bias, and feedback delays.",
    hi: "शेड्यूलिंग की समस्याओं, निर्णायक पूर्वाग्रह और फ़ीडबैक में देरी को समाप्त करने के लिए डिज़ाइन किए गए एल्गोरिदम।",
    gu: "શેડ્યૂલિંગ સમસ્યાઓ, નિર્ણાયક પૂર્વગ્રહ અને વિલંબ દૂર કરવા માટે ખાસ અલ્ગોરિધમ્સ.",
  },
  ai1Title: { en: "Heuristic Judge Matching", hi: "ह्यूरिस्टिक निर्णायक मिलान", gu: "જ્યુરી મેચિંગ અલ્ગોરિધમ" },
  ai1Desc: {
    en: "Evaluates judge domain expertise, declared conflicts of interest, and project technical tags to allocate balanced evaluation panels automatically.",
    hi: "निर्णायक विशेषज्ञता और प्रोजेक्ट टैग के आधार पर संतुलित मूल्यांकन पैनल स्वचालित रूप से आवंटित करता है।",
    gu: "નિર્ણાયકની કુશળતા અને પ્રોજેક્ટ ટેકનોલોજી અનુસાર સંતુલિત પેનલ ફાળવે છે.",
  },
  ai2Title: { en: "FairScore™ Z-Score Engine", hi: "फेयरस्कोर™ Z-स्कोर इंजन", gu: "ફેરસ્કોર™ Z-સ્કોર એન્જિન" },
  ai2Desc: {
    en: "Computes real-time Z-scores across all judge scorecards to flag anomalous harshness or leniency drift before grand prizes are decided.",
    hi: "विजेताओं के निर्णय से पहले कठोरता या पक्षपात को चिह्नित करने के लिए वास्तविक समय Z-स्कोर की गणना करता है।",
    gu: "ઇનામો નક્કી થાય તે પહેલાં અયોગ્ય માર્કિંગ અને પૂર્વગ્રહ પકડવા માટે રીઅલ-ટાઇમ Z-સ્કોર વિશ્લેષણ.",
  },
  ai3Title: { en: "Natural Language Feedback Summaries", hi: "प्राकृतिक भाषा फ़ीडबैक सारांश", gu: "કુદરતી ભાષા પ્રતિસાદ સારાંશ" },
  ai3Desc: {
    en: "Synthesizes disparate evaluator notes, technical critique, and attendee comments into clear, concise executive summaries for each team.",
    hi: "निर्णायक की टिप्पणियों और समीक्षाओं को प्रत्येक टीम के लिए स्पष्ट सारांश में संश्लेषित करता है।",
    gu: "નિર્ણાયકોની નોંધો અને સમીક્ષાઓનું દરેક ટીમ માટે સચોટ અને સ્પષ્ટ સારાંશ તૈયાર કરે છે.",
  },
  ai4Title: { en: "Personalized Visitor Recommendations", hi: "व्यक्तिगत आगंतुक अनुशंसाएं", gu: "વ્યક્તિગત મુલાકાતી ભલામણો" },
  ai4Desc: {
    en: "Matches visitor interest profiles with exhibition booths using cosine similarity for high-relevance booth discovery.",
    hi: "दर्शकों की रुचियों के आधार पर सबसे प्रासंगिक स्टॉल्स की सिफारिश करता है।",
    gu: "મુલાકાતીઓની પસંદગી અનુસાર શ્રેષ્ઠ પ્રદર્શન સ્ટોલ્સ સૂચવે છે.",
  },

  // How It Works
  workflowPill: { en: "HOW IT WORKS", hi: "यह कैसे काम करता है", gu: "આ કેવી રીતે કાર્ય કરે છે" },
  workflowHeading: { en: "From launch to awards in four simple steps.", hi: "शुरुआत से पुरस्कार तक चार सरल चरणों में।", gu: "શરૂઆતથી એવોર્ડ્સ સુધી ચાર સરળ પગલાંમાં." },
  step1: { en: "Create Event", hi: "इवेंट बनाएं", gu: "ઇવેન્ટ બનાવો" },
  step1Desc: { en: "Configure event dates, track categories, and custom rubric weights in under two minutes.", hi: "दो मिनट में इवेंट की तारीखें, श्रेणियां और स्कोरिंग मानदंड निर्धारित करें।", gu: "બે મિનિટમાં ઇવેન્ટ તારીખો, ટ્રેક અને મૂલ્યાંકન માપદંડ સેટ કરો." },
  step2: { en: "Register Participants", hi: "प्रतिभागियों का पंजीकरण", gu: "સહભાગીઓનું રજીસ્ટ્રેશન" },
  step2Desc: { en: "Teams submit project details and links, instantly receiving digital stall QR passes.", hi: "टीमें प्रोजेक्ट विवरण दर्ज करती हैं और तुरंत डिजिटल स्टॉल पास प्राप्त करती हैं।", gu: "ટીમો પ્રોજેક્ટ વિગતો સબમિટ કરે છે અને તરત ડિજિટલ સ્ટોલ પાસ મેળવે છે." },
  step3: { en: "Manage & Judge", hi: "प्रबंधन और मूल्यांकन", gu: "સંચાલન અને મૂલ્યાંકન" },
  step3Desc: { en: "Allocate panels with AI assistance, evaluate criteria on mobile devices, and monitor live leaderboards.", hi: "AI सहायता से पैनल आवंटित करें, मोबाइल से स्कोर दें और लाइव लीडरबोर्ड देखें।", gu: "AI સહાયથી પેનલ ફાળવો, મોબાઇલથી સ્કોર કરો અને લાઇવ લીડરબોર્ડ જુઓ." },
  step4: { en: "Analyze Results", hi: "परिणाम विश्लेषण", gu: "પરિણામોનું વિશ્લેષણ" },
  step4Desc: { en: "Review telemetry, export AI feedback summaries, and generate cryptographically verified certificates.", hi: "टेलीमेट्री की समीक्षा करें, AI सारांश निर्यात करें और सत्यापित प्रमाण पत्र बनाएं।", gu: "ટેલિમેટ્રી તપાસો, AI સારાંશ નિકાસ કરો અને સુરક્ષિત પ્રમાણપત્રો બનાવો." },

  // Call to Action
  readyHeading: { en: "Ready to run your next event on intelligent infrastructure?", hi: "क्या आप अपने अगले इवेंट को बुद्धिमान तकनीक पर चलाने के लिए तैयार हैं?", gu: "શું તમે તમારી આગામી ઇવેન્ટને બુદ્ધિશાળી ટેકનોલોજી પર ચલાવવા તૈયાર છો?" },
  readySubtitle: { en: "Free to adopt. Works for events of any size, from college fests to international expos.", hi: "निःशुल्क अपनाएं। कॉलेज फेस्ट से लेकर अंतरराष्ट्रीय एक्सपो तक किसी भी आकार के इवेंट के लिए उपयुक्त।", gu: "મફતમાં અપનાવો. કોલેજ ફેસ્ટથી લઈને આંતરરાષ્ટ્રીય એક્સ્પો સુધી કોઈપણ ઇવેન્ટ માટે ઉત્તમ." },

  // Pricing Tiers
  starterTierName: { en: "Community Starter", hi: "कम्युनिटी स्टार्टर", gu: "કમ્યુનિટી સ્ટાર્ટર" },
  starterTierDesc: { en: "Ideal for college hackathons, club exhibitions, and student competitions getting started.", hi: "कॉलेज हैकथॉन, क्लब प्रदर्शनियों और छात्र प्रतियोगिताओं के लिए आदर्श।", gu: "કોલેજ હેકાથોન, ક્લબ પ્રદર્શનો અને વિદ્યાર્થી સ્પર્ધાઓ માટે શ્રેષ્ઠ." },
  growthTierName: { en: "Growth Fest Pro", hi: "ग्रोथ फेस्ट प्रो", gu: "ગ્રોથ ફેસ્ટ પ્રો" },
  growthTierDesc: { en: "Everything an organizer needs for professional tech expos, multi-track hackathons, and paid summits.", hi: "पेशेवर तकनीकी एक्सपो, बहु-ट्रैक हैकथॉन और सम्मेलनों के लिए सम्पूर्ण समाधान।", gu: "પ્રોફેશનલ ટેક એક્સ્પો, મલ્ટિ-ટ્રેક હેકાથોન અને સમિટ માટે બધું જ જરૂરી." },
  enterpriseTierName: { en: "Enterprise Scale", hi: "एंटरप्राइज़ स्केल", gu: "એન્ટરપ્રાઇઝ સ્કેલ" },
  enterpriseTierDesc: { en: "Tailored for university networks, global conferences, and corporate innovation showcases.", hi: "विश्वविद्यालय नेटवर्क, वैश्विक सम्मेलनों और कॉर्पोरेट नवाचार के लिए विशेष रूप से निर्मित।", gu: "યુનિવર્સિટી નેટવર્ક, વૈશ્વિક પરિષદો અને કોર્પોરેટ ઇનોવેશન માટે ખાસ તૈયાર." },
  ctaStartFree: { en: "Start Free Event", hi: "निःशुल्क इवेंट शुरू करें", gu: "મફત ઇવેન્ટ શરૂ કરો" },
  ctaLaunchGrowth: { en: "Launch Growth Pro Event", hi: "ग्रोथ प्रो इवेंट शुरू करें", gu: "ગ્રોથ પ્રો ઇવેન્ટ શરૂ કરો" },
  ctaDeployEnterprise: { en: "Deploy Enterprise OS", hi: "एंटरप्राइज़ ओएस तैनात करें", gu: "એન્ટરપ્રાઇઝ OS ગોઠવો" },

  // Scanner & Telemetry
  offlineBadge: { en: "Offline Mode · Scans Queued", hi: "ऑफ़लाइन मोड · स्कैन कतार में", gu: "ઓફલાઇન મોડ · સ્કેન કતારમાં" },
  onlineBadge: { en: "Live Connected", hi: "लाइव कनेक्टेड", gu: "લાઇવ કનેક્ટેડ" },
  syncNow: { en: "Sync Queue", hi: "कतार सिंक करें", gu: "કતાર સિંક કરો" },
  scanAttendee: { en: "Scan Attendee Pass", hi: "प्रतिभागी पास स्कैन करें", gu: "હાજરી પાસ સ્કેન કરો" },
  enterManualCode: { en: "Enter Pass Code", hi: "पास कोड दर्ज करें", gu: "પાસ કોડ દાખલ કરો" },
  welcome: { en: "Welcome in!", hi: "स्वागत है!", gu: "સ્વાગત છે!" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("eventos_lang") as Language;
      if (stored && (stored === "en" || stored === "hi" || stored === "gu")) {
        setLanguageState(stored);
      }
    } catch {}
  }, []);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    try {
      localStorage.setItem("eventos_lang", lang);
      document.cookie = `eventos_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
  }

  function t(key: string, fallback?: string): string {
    const entry = translations[key];
    if (!entry) return fallback || key;
    return entry[language] || entry.en || fallback || key;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
