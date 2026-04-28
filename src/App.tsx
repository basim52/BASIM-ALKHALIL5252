/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  Sparkles, 
  Terminal, 
  Hash, 
  Type as TypeIcon, 
  Camera, 
  ChevronLeft, 
  Copy, 
  Check, 
  RefreshCw,
  Layout,
  Clock,
  Layers,
  Mic,
  Clapperboard,
  Play,
  Image as ImageIcon,
  History,
  Settings,
  Zap,
  Globe,
  Music,
  Video as VideoIcon,
  Download,
  AlertCircle,
  Key,
  Youtube,
  BarChart3,
  TrendingUp,
  User,
  LogOut,
  ChevronRight,
  Database,
  Search,
  Cpu,
  Activity,
  Lightbulb,
  Film,
  Monitor,
  Star,
  Drama,
  BookOpen,
  Ghost,
  Palmtree,
  Flame,
  Theater,
  Plus,
  Trash2
} from 'lucide-react';
import { GoogleGenAI, Modality, Type, VideoGenerationReferenceType, VideoGenerationReferenceImage } from "@google/genai";
import { type GenerateContentResponse } from "@google/genai";
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Modular Components
import { SidebarItem, MiniStat } from './components/Sidebar';
import { YoutubeDashboard } from './components/YoutubeDashboard';
import { HistoryView } from './components/HistoryView';
import { SceneCard } from './components/SceneCard';
import { Storyboard } from './components/Storyboard';
import { IdeaGenerator } from './components/IdeaGenerator';
import { StoryboardPreview } from './components/StoryboardPreview';
import { ActionButton, ContentBlock, Tag } from './components/Common';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const provider = new GoogleAuthProvider();

const styleLabels: Record<string, string> = {
  cinematic: 'سينمائي',
  netflix: 'نتفلكس',
  hollywood: 'هوليود',
  bollywood: 'بوليوود',
  egyptian: 'دراما مصرية',
  syrian: 'دراما سورية',
  saudi: 'دراما سعودية',
  vlog: 'فلوق',
  dramatic: 'درامي',
  educational: 'تعليمي',
  horror: 'رعب'
};

const styleLabelsEn: Record<string, string> = {
  cinematic: 'cinematic',
  netflix: 'Netflix',
  hollywood: 'Hollywood',
  bollywood: 'Bollywood',
  egyptian: 'Egyptian drama',
  syrian: 'Syrian drama',
  saudi: 'Saudi drama',
  vlog: 'vlog',
  dramatic: 'dramatic',
  educational: 'educational',
  horror: 'horror'
};

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type ToolType = 'script' | 'prompt' | 'metadata' | 'history' | 'youtube' | 'ideas';
type VideoStyle = 'cinematic' | 'vlog' | 'educational' | 'dramatic' | 'horror' | 'netflix' | 'hollywood' | 'bollywood' | 'egyptian' | 'syrian' | 'saudi';
type AspectRatio = '16:9' | '9:16';

interface GeneratedContent {
  title?: string;
  plotArc?: string;
  totalDuration?: number;
  characterSheet?: string;
  script?: {
    scene: number;
    visual: string;
    audio: string;
    duration?: number;
    emotionalBeat?: string;
    id: string;
  }[];
  ideas?: string[];
  prompt?: string;
  tags?: string[];
  description?: string;
  caption?: string;
  voiceSelection?: string;
}


function ToolNavigation({ activeTool, setActiveTool }: { activeTool: ToolType, setActiveTool: (t: ToolType) => void, result: any }) {
  const tools: { id: ToolType, label: string, icon: any }[] = [
    { id: 'script', label: 'السيناريو', icon: Clapperboard },
    { id: 'prompt', label: 'المطالبة', icon: Terminal },
    { id: 'metadata', label: 'البيانات', icon: Hash }
  ];

  return (
    <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 backdrop-blur-md border border-slate-200/50 rounded-2xl w-fit mx-auto mb-10 relative">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        return (
          <button 
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`px-8 py-3.5 rounded-xl font-display font-bold text-xs transition-all flex items-center justify-center gap-3 relative z-10 ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {isActive && (
              <motion.div 
                layoutId="tool-nav-bg"
                className="absolute inset-0 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon size={16} className={`relative z-10 transition-transform ${isActive ? 'scale-110' : ''}`} />
            <span className="relative z-10 uppercase tracking-widest">{tool.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolType>('script');
  const [modelType, setModelType] = useState<'flash' | 'pro'>('flash');
  const [videoStyle, setVideoStyle] = useState<VideoStyle>('cinematic');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [videoDuration, setVideoDuration] = useState(60);
  const [sceneCount, setSceneCount] = useState(5);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [history, setHistory] = useState<{content: GeneratedContent, date: any, type: string, id?: string}[]>([]);
  const [copied, setCopied] = useState(false);
  
  // Real-time Auth & YouTube States
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [ytTokens, setYtTokens] = useState<any>(null);
  const [ytStats, setYtStats] = useState<any>(null);
  const [isSyncingArchive, setIsSyncingArchive] = useState(false);
  const [ideaCount, setIdeaCount] = useState(5);
  const [showCharConfig, setShowCharConfig] = useState(false);
  const [characters, setCharacters] = useState<any[]>([
    { id: 'char-1', name: '', age: '', gender: '', hair: '', clothing: '', other: '' }
  ]);

  const activeStyleLabel = styleLabels[videoStyle] || videoStyle;
  const activeStyleLabelEn = styleLabelsEn[videoStyle] || videoStyle;

  const addCharacter = () => {
    setCharacters(prev => [...prev, { 
      id: `char-${Date.now()}`, 
      name: '', 
      age: '', 
      gender: '', 
      hair: '', 
      clothing: '', 
      other: '' 
    }]);
  };

  const removeCharacter = (id: string) => {
    if (characters.length > 1) {
      setCharacters(prev => prev.filter(c => c.id !== id));
    }
  };

  const updateCharacter = (id: string, updates: any) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const updateScene = (sceneId: string, updates: any) => {
    setResult(prev => {
      if (!prev || !prev.script) return prev;
      return {
        ...prev,
        script: prev.script.map(s => s.id === sceneId ? { ...s, ...updates } : s)
      };
    });
  };

  // Generation States
  const [activeGeneration, setActiveGeneration] = useState<{[key: string]: 'image' | 'audio' | 'video' | 'music' | null}>({});
  const [mediaResults, setMediaResults] = useState<{[key: string]: {type: 'image' | 'audio' | 'video' | 'music', url: string}}>({});

  // Checks
  const [hasPaidKey, setHasPaidKey] = useState<boolean>(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [voiceSelection, setVoiceSelection] = useState<string>('ar-XA-Wavenet-B'); // Default Arabic Male

  const fetchArchive = useCallback(async (userId: string) => {
    setIsSyncingArchive(true);
    setError(null);
    try {
      // Fetch without orderBy first to avoid index issues, then sort in memory
      const q = query(
        collection(db, 'projects'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          date: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString('ar-SA') : 'تاريخ غير متوفر'
        };
      }) as any[];
      
      // Sort by date manually
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });

      setHistory(docs);
      console.log("Archive sync successful, found:", docs.length, "for user:", userId);
    } catch (e: any) {
      console.error("Archive Sync Error Detail:", e);
      let errorMsg = `خطأ في مزامنة الأرشيف: ${e.message}`;
      if (e.message?.includes("permission-denied")) {
        errorMsg = "عذراً، لا نملك إذناً لقراءة بياناتك. تأكد من تسجيل الدخول.";
      }
      setError(errorMsg);
    } finally {
      setIsSyncingArchive(false);
    }
  }, []);

  const fetchYtStats = useCallback(async (tokens: any) => {
    try {
      const response = await fetch('/api/youtube/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens })
      });
      if (response.ok) {
        const data = await response.json();
        setYtStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    // Firebase Auth Observer
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        fetchArchive(firebaseUser.uid);
      }
    });

    // Check for YouTube Auth Message
    const handleYtMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'YOUTUBE_AUTH_SUCCESS') {
        const { tokens, channel } = event.data;
        setYtTokens(tokens);
        setYtStats({ channel });
        localStorage.setItem('yt_tokens', JSON.stringify(tokens));
        
        // Save to user profile in Firebase
        if (user) {
          await setDoc(doc(db, 'users', user.uid), {
            youtubeLinked: true,
            youtubeChannelId: channel.id,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }
    };
    window.addEventListener('message', handleYtMessage);

    // Initial check for saved tokens
    const savedTokens = localStorage.getItem('yt_tokens');
    if (savedTokens) {
      const parsed = JSON.parse(savedTokens);
      setYtTokens(parsed);
      fetchYtStats(parsed);
    }
    
    // Check key
    const checkKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasPaidKey(hasKey);
      }
    };
    checkKey();

    return () => {
      unsubscribe();
      window.removeEventListener('message', handleYtMessage);
    };
  }, [user, fetchArchive, fetchYtStats]);

  const connectYoutube = async () => {
    try {
      const response = await fetch('/api/auth/youtube/url');
      const { url } = await response.json();
      window.open(url, 'youtube_auth', 'width=600,height=700');
    } catch (e) {
      console.error(e);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => auth.signOut();

  const handleOpenKeyDialog = useCallback(async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasPaidKey(true);
      setShowKeyDialog(false);
    }
  }, []);

  const saveToHistory = useCallback(async (content: GeneratedContent) => {
    if (!user) return; // Only archive for logged in users
    try {
      await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        title: content.title || 'مشروع غير معنون',
        description: content.description || '',
        videoStyle,
        totalDuration: content.totalDuration || 0,
        script: content.script || [],
        ideas: content.ideas || [],
        prompt: content.prompt || '',
        tags: content.tags || [],
        caption: content.caption || '',
        characterSheet: content.characterSheet || '',
        type: activeTool,
        projectId: `proj-${Date.now()}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      fetchArchive(user.uid);
    } catch (e) {
      console.error("Firebase Archive Error:", e);
    }
  }, [user, videoStyle, activeTool, fetchArchive]);

  const handleIdeaGenerate = (count: number) => {
    setIdeaCount(count);
    generateContent();
  };

  const handleUseIdea = (idea: string) => {
    setInput(idea);
    setActiveTool('script');
  };

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const copyFullScript = useCallback(() => {
    if (!result || !result.script) return;
    const formattedScript = [
      `العنوان: ${result.title}`,
      `الأسلوب: ${videoStyle.toUpperCase()}`,
      '',
      ...result.script.map((s: any) => (
        `المشهد ${s.scene}:\n- الوصف البصري: ${s.visual}\n- النص الصوتي: ${s.audio}\n`
      ))
    ].join('\n');
    handleCopy(formattedScript);
  }, [result, videoStyle, handleCopy]);

  const formatGeminiError = (e: any) => {
    console.error("Gemini Error Context:", e);
    // Deep check for message in different common error structures
    const message = String(e.message || e.error?.message || (typeof e === 'string' ? e : JSON.stringify(e)) || "").toLowerCase();
    const status = String(e.status || e.error?.status || "").toLowerCase();
    
    if (message.includes("429") || message.includes("quota") || status.includes("exhausted") || message.includes("exhausted")) {
      return "عذراً، لقد تجاوزت حصة الاستخدام المجانية المتاحة (Quota Exceeded). يرجى الانتظار قليلاً ثم المحاولة مرة أخرى، أو إضافة مفتاح API خاص بك من الإعدادات لزيادة حدود الاستخدام.";
    }
    if (message.includes("safety") || message.includes("block") || message.includes("flagged")) {
      return "عذراً، تم حظر المحتوى بواسطة فلاتر الأمان. يرجى محاولة تغيير الوصف لتبسيط المحتوى أو تجنب الكلمات الحساسة.";
    }
    if (message.includes("api key") || message.includes("expired") || message.includes("invalid")) {
      return "مشكلة في صلاحية مفتاح API. يرجى التأكد من المفتاح المدخل في الإعدادات.";
    }
    return `فشل العمل: ${e.message || e.error?.message || "حدث خطأ غير متوقع في محرك الذكاء الاصطناعي"}`;
  };

  const generateContent = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setError(null);
    // Don't clear result immediately to prevent "flashing" white screen
    // We only clear if tool changes significantly or after new result arrives
    // setResult(null); // REMOVED
    // setMediaResults({}); // REMOVED

    try {
      const manualTraitsStr = characters
        .map((char, idx) => {
          const traits = Object.entries(char)
            .filter(([k, v]) => k !== 'id' && (v as string).trim() !== '')
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
          return traits ? `Character ${idx + 1} (${char.name || 'Unnamed'}): ${traits}` : '';
        })
        .filter(t => t !== '')
        .join('\n');

      const charNote = manualTraitsStr ? `\nMandatory Multi-Character Consistency Rules:\n${manualTraitsStr}\nEnsure these specific descriptions are used consistently across all scenes where these characters appears.` : "";

      const systemInstruction = `أنت كاتب سيناريو ومخرج سينمائي حائز على جوائز مرموقة، متخصص في بناء الحبكات الدرامية العميقة (Story Arcs). 
      مهمتك هي تحويل فكرة المستخدم إلى سيناريو درامي قوي يتجنب الأسلوب الوثائقي البارد تماماً.
      
      قواعد بناء القصة الدرامية المكثفة:
      1. هيكل الفصول الثلاثة (3-Act Structure) الإلزامي:
         - الفصل الأول (البداية): ابدأ بحدث مفاجئ أو صراع جلي (Inciting Incident). لا تكتفِ بالوصف، بل ابدأ بالحركة.
         - الفصل الثاني (الوسط): يجب أن يحدث "تحول جوهري" (Turning Point) يغير مسار القصة تماماً. زد من حدة الرهانات (Raise the Stakes).
         - الفصل الثالث (النهاية): ذروة الصراع (Climax) ثم الحل الذي يترك أثراً عاطفياً أو فكرياً باقياً (Impactful Resolution).
      
      2. حوار الشخصيات: القصة تُبنى بلسان أصحابها. اجعل الحوار (Dialogue) هو المحرك الرئيسي للحدث وليس مجرد وصف خارجي.
      
      3. التطور النفسي: تأكد من أن الحالة الشعورية (Emotional Beat) تتغير بين مشهد وآخر.
      
      النمط الدرامي المعتمد: ${activeStyleLabel}.
      ${charNote}
      مهم جداً: أعد كائن JSON صالح فقط.`;

      let promptText = "";
      let responseSchema: any = null;

      if (activeTool === 'script') {
        promptText = `قم بتطوير سيناريو درامي متكامل بنمط ${activeStyleLabel} بمدة ${videoDuration} ثانية يتكون من ${sceneCount} مشاهد. اتبع هيكل الفصول الثلاثة (بداية، وسط/ذروة، نهاية مؤلمة أو ملهمة). الموضوع: "${input}".`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "العنوان الدرامي للقصة" },
            plotArc: { type: Type.STRING, description: "شرح لتحول الحبكة من البداية للذروة للنهاية" },
            characterSheet: { type: Type.STRING, description: "Detailed physical description of main characters in English" },
            script: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scene: { type: Type.NUMBER },
                  visual: { type: Type.STRING, description: "Cinematic visual description in English (lighting, camera, emotion)" },
                  audio: { type: Type.STRING, description: "الحوار الدرامي أو التعليق الصوتي المؤثر باللغة العربية" },
                  emotionalBeat: { type: Type.STRING, description: "النبض الشعوري للمشهد (مثلاً: توتر، أمل، انكسار)" },
                  duration: { type: Type.NUMBER, description: "مدة المشهد بالثواني" }
                },
                required: ["scene", "visual", "audio", "duration", "emotionalBeat"]
              }
            }
          },
          required: ["title", "script", "plotArc", "characterSheet"]
        };
      } else if (activeTool === 'prompt') {
        promptText = `قم بتوليد مطالبة بصرية تقنية بنمط ${activeStyleLabel} لـ: "${input}".`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING }
          },
          required: ["prompt"]
        };
      } else if (activeTool === 'metadata') {
        promptText = `قم بتوليد بيانات وصفية رائجة لـ: "${input}".`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            caption: { type: Type.STRING }
          },
          required: ["title", "description", "tags", "caption"]
        };
      } else if (activeTool === 'ideas') {
        promptText = `قم بتوليد ${ideaCount} أفكار إبداعية وفريدة لفيديوهات يوتيوب حول: "${input}". اجعلها جذابة وعصرية.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            ideas: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["ideas"]
        };
      }

      const response = await ai.models.generateContent({
        model: modelType === 'pro' ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview",
        contents: promptText,
        config: { 
          systemInstruction, 
          responseMimeType: "application/json",
          responseSchema
        }
      });

      const text = response.text;
      if (!text) throw new Error("لا يوجد رد من المحرك العصبي.");
      
      const parsedResult = JSON.parse(text);
      
      // Inject IDs for scene-specific generation
      if (parsedResult.script) {
        parsedResult.script = parsedResult.script.map((s: any, i: number) => ({...s, id: `scene-${i}`}));
      }

      setMediaResults({}); // Clear old media only when new script is ready
      setResult(parsedResult);
      saveToHistory(parsedResult);
    } catch (e: any) {
      setError(formatGeminiError(e));
    } finally {
      setIsLoading(false);
    }
  };

  const getCharacterTraits = () => {
    const manual = characters
      .map((char, idx) => {
        const traits = Object.entries(char)
          .filter(([k, v]) => k !== 'id' && (v as string).trim() !== '')
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        return traits ? `Character ${idx + 1} (${char.name || 'Unnamed'}): ${traits}` : '';
      })
      .filter(t => t !== '')
      .join('\n');

    if (manual) return `\nCharacter Consistency (Manual):\n${manual}`;
    return result?.characterSheet ? `\nCharacter Consistency: ${result.characterSheet}` : "";
  };

  const generateSceneImage = async (sceneId: string, visualPrompt: string) => {
    setActiveGeneration(prev => ({...prev, [sceneId]: 'image'}));
    const characterConsistency = getCharacterTraits();
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: `Create a cinematic high-quality frame for: ${visualPrompt}. Realistic, ${activeStyleLabelEn} style. ${aspectRatio === '9:16' ? 'Vertical 9:16 portrait orientation.' : 'Horizontal 16:9 landscape orientation.'}${characterConsistency}`,
        config: { imageConfig: { aspectRatio } }
      });

      const part = response.candidates[0].content.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        // Convert to Blob URL for better performance and smaller state
        const byteCharacters = atob(part.inlineData.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {type: 'image/png'});
        const url = URL.createObjectURL(blob);
        
        setMediaResults(prev => ({...prev, [sceneId]: { type: 'image', url }}));
      }
    } catch (e) {
      console.error(e);
      setError(formatGeminiError(e));
    } finally {
      setActiveGeneration(prev => ({...prev, [sceneId]: null}));
    }
  };

  const generateSceneAudio = async (sceneId: string, text: string) => {
    setActiveGeneration(prev => ({...prev, [sceneId]: 'audio'}));
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceSelection } } }
        }
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        const url = `data:audio/wav;base64,${audioData}`;
        setMediaResults(prev => ({...prev, [`audio-${sceneId}`]: { type: 'audio', url }}));
        const audio = new Audio(url);
        audio.play();
      }
    } catch (e) {
      console.error(e);
      setError(formatGeminiError(e));
    } finally {
      setActiveGeneration(prev => ({...prev, [sceneId]: null}));
    }
  };

  const generateSceneVideo = async (sceneId: string, visualPrompt: string) => {
    if (!hasPaidKey) {
      setShowKeyDialog(true);
      return;
    }

    setActiveGeneration(prev => ({...prev, [sceneId]: 'video'}));
    const characterConsistency = getCharacterTraits();

    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: `Cinematic high-quality video for: ${visualPrompt}. Realistic, ${activeStyleLabelEn} style. Detailed textures, smooth camera motion. ${aspectRatio === '9:16' ? 'Vertical 9:16 orientation.' : 'Horizontal 16:9 orientation.'}. ${characterConsistency}`,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio
        }
      });

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY || '' },
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setMediaResults(prev => ({...prev, [`video-${sceneId}`]: { type: 'video', url }}));
      }
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("Requested entity was not found")) {
        setHasPaidKey(false);
        setShowKeyDialog(true);
      } else {
        setError(formatGeminiError(e));
      }
    } finally {
      setActiveGeneration(prev => ({...prev, [sceneId]: null}));
    }
  };

  const generateGlobalMusic = async () => {
    if (!hasPaidKey) {
      setShowKeyDialog(true);
      return;
    }

    if (!result?.title) return;

    setActiveGeneration(prev => ({...prev, 'global-music': 'music'}));
    try {
      const promptText = `Generate a 30-second cinematic ${activeStyleLabelEn} orchestral background track for a video titled "${result.title}". Mood: ${activeStyleLabelEn}.`;
      
      const responseStream = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: promptText,
      });

      let audioBase64 = "";
      let mimeType = "audio/wav";

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
        }
      }

      if (audioBase64) {
        const binary = atob(audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        setMediaResults(prev => ({...prev, 'global-music': { type: 'music', url }}));
      }
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("Requested entity was not found")) {
        setHasPaidKey(false);
        setShowKeyDialog(true);
      } else {
        setError(formatGeminiError(e));
      }
    } finally {
      setActiveGeneration(prev => ({...prev, 'global-music': null}));
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 font-sans selection:bg-indigo-500/30" dir="rtl">
      {/* High-End Navigation */}
      <nav className="fixed top-0 left-0 w-full h-20 bg-white/60 backdrop-blur-2xl border-b border-slate-200/60 z-[100] flex items-center justify-between px-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 rotate-3">
              <Clapperboard size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-display font-black tracking-tighter text-slate-900">استوديو فرفشة</span>
              <span className="text-[8px] font-mono font-bold text-indigo-500 uppercase tracking-widest">Neural Pro Suite</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center bg-slate-100/50 border border-slate-200/50 rounded-xl px-4 py-2 gap-3 w-80 group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <Search size={14} className="text-slate-400 group-focus-within:text-indigo-500" />
            <input type="text" placeholder="البحث في الأرشيف.." className="bg-transparent border-none outline-none text-xs font-display flex-1" />
            <kbd className="text-[8px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">⌘K</kbd>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end px-4 border-l border-slate-100">
            <span className="text-[10px] font-display font-black text-slate-900">{user?.displayName || 'ضيف استوديو'}</span>
            <span className="text-[8px] font-mono text-indigo-500 uppercase font-black">الحالة: متصل الآن</span>
          </div>
          {user ? (
            <div className="relative group">
              <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer hover:scale-105 transition-transform" alt="Avatar" />
              <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full translate-x-1/4 -translate-y-1/4 shadow-sm" />
              
              {/* Dropdown Logout */}
              <div className="absolute top-full left-0 mt-2 w-32 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[110] transform origin-top-right">
                <button onClick={logout} className="w-full px-4 py-3 text-right text-xs font-display font-medium text-slate-600 hover:bg-slate-50 hover:text-red-500 rounded-xl flex items-center justify-between gap-2 transition-colors">
                   <span>تسجيل خروج</span>
                   <LogOut size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={signInWithGoogle} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95">
              <User size={20} />
            </button>
          )}
        </div>
      </nav>

      <div className="flex pt-20">
        {/* Rail Nav */}
        <aside className="w-20 md:w-72 border-l border-slate-200 h-[calc(100vh-5rem)] sticky top-20 bg-white/40 backdrop-blur-xl flex flex-col items-center md:items-stretch overflow-y-auto z-40">
          <div className="p-6 space-y-10 flex-1">
            <div className="space-y-4">
              <p className="hidden md:block text-[9px] font-mono uppercase tracking-[0.3em] text-slate-400 px-4 mb-4 font-black">غرفة القيادة</p>
              <SidebarItem active={activeTool === 'script'} icon={<Clapperboard size={20} />} label="استوديو السيناريو" onClick={() => setActiveTool('script')} />
              <SidebarItem active={activeTool === 'ideas'} icon={<Lightbulb size={20} />} label="مولد الأفكار" onClick={() => setActiveTool('ideas')} />
              <SidebarItem active={activeTool === 'prompt'} icon={<Terminal size={20} />} label="مهندس المطالبات" onClick={() => setActiveTool('prompt')} />
              <SidebarItem active={activeTool === 'metadata'} icon={<Hash size={20} />} label="محسن SEO" onClick={() => setActiveTool('metadata')} />
              <SidebarItem active={activeTool === 'youtube'} icon={<Youtube size={20} />} label="تحليلات يوتيوب" onClick={() => setActiveTool('youtube')} />
              <SidebarItem active={activeTool === 'history'} icon={<Database size={20} />} label="الأرشيف السحابي" onClick={() => setActiveTool('history')} />
            </div>

            <div className="pt-6">
              <button 
                onClick={handleOpenKeyDialog}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all group ${hasPaidKey ? 'bg-indigo-50 border-indigo-200' : 'bg-red-50 border-red-200 hover:bg-red-100'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${hasPaidKey ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white animate-pulse'}`}>
                    <Key size={14} />
                  </div>
                  <div className="md:flex flex-col items-end hidden">
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none">مفتاح API الخاص بك</p>
                    <p className={`text-[11px] font-black uppercase ${hasPaidKey ? 'text-indigo-700' : 'text-red-700'}`}>
                      {hasPaidKey ? 'متصل بنجاح' : 'غير مرتبط'}
                    </p>
                  </div>
                </div>
                {!hasPaidKey && <ChevronLeft size={14} className="text-red-400 group-hover:translate-x-1 transition-transform rotate-180 hidden md:block" />}
              </button>
            </div>

            <div className="pt-10 border-t border-slate-200/50">
              <p className="hidden md:block text-[9px] font-mono uppercase tracking-[0.3em] text-slate-400 px-4 mb-4 font-black">حالة الجهاز</p>
              <div className="px-4 space-y-6">
                <div className="bg-slate-900 flex items-center justify-between p-3 rounded-xl shadow-lg border border-white/5">
                   <Activity size={14} className="text-indigo-500 animate-pulse" />
                   <div className="flex flex-col items-end">
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest text-right">نواة Gemini العصبية</span>
                      <span className="text-[10px] font-mono text-white font-black">جاهز للاستخدام</span>
                   </div>
                </div>
                <div className="space-y-4">
                   <MiniStat label="حمولة المعالجة الآلية" value={isLoading ? 88 : 12} color="bg-indigo-500" />
                   <MiniStat label="مزامنة البيانات السحابية" value={isSyncingArchive ? 100 : 0} color="bg-violet-500" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-slate-200/50 flex items-center justify-between">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.6)]" />
            <Settings className="w-5 h-5 text-slate-400 hover:text-indigo-500 cursor-pointer transition-colors" />
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          </div>
        </aside>

        {/* Console View */}
        <main className="flex-1 min-h-screen bg-slate-50/30">
          <div className="max-w-7xl mx-auto p-6 md:p-14">
            <AnimatePresence mode="popLayout">
              {activeTool === 'history' ? (
                <HistoryView 
                  history={history} 
                  isSyncing={isSyncingArchive} 
                  user={user}
                  onSelect={(item: any) => {
                    setResult(item); 
                    setActiveTool(item.type as ToolType);
                  }} 
                  onRefresh={() => user && fetchArchive(user.uid)}
                />
              ) : activeTool === 'youtube' ? (
                <YoutubeDashboard 
                  stats={ytStats} 
                  videoStyle={videoStyle}
                  onConnect={connectYoutube} 
                  onGetIdeas={() => {
                    setInput(ytStats ? `اقتراح فكرة فيديو بناءً على أداء القناة الأخير: ${ytStats.latestVideos?.[0]?.snippet?.title}` : "فكرة فيديو يوتيوب رائجة");
                    setActiveTool('script');
                  }} 
                />
              ) : (
                <div className="space-y-16">
                  {/* Master Terminal */}
                  <section className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-10 bg-indigo-600 rounded-full" />
                          <h2 className="text-4xl font-display font-extrabold tracking-tight text-slate-900 capitalize">
                            تخليق {activeTool === 'script' ? 'السيناريو' : activeTool === 'prompt' ? 'المطالبات' : activeTool === 'ideas' ? 'الأفكار' : 'البيانات'}
                          </h2>
                        </div>
                        <p className="text-slate-500 text-lg font-light max-w-2xl font-display">
                          {activeTool === 'script' && "توليد نصوص متعددة الوسائط مع مراجع بصرية ومعاينة صوتية ذكية."}
                          {activeTool === 'ideas' && "توليد أفكار إبداعية وجذابة لفيديوهاتك بناءً على مواضيعك المفضلة."}
                          {activeTool === 'prompt' && "هندسة مطالبات متقدمة وشاملة لشبكات توليد الفيديو العصبية."}
                          {activeTool === 'metadata' && "ضبط البيانات الوصفية باستخدام خوارزميات لزيادة التفاعل والانتشار."}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {(activeTool === 'script' || activeTool === 'ideas') && (
                          <>
                            <div className="bg-white border border-slate-200 p-4 rounded-3xl flex flex-col gap-2 shadow-sm min-w-[170px]">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <Clock size={12} className="text-indigo-600" />
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المدة الزمنية</span>
                                </div>
                                <span className="text-xs font-bold text-indigo-600">{videoDuration}s</span>
                              </div>
                              <input 
                                type="range" 
                                min="8" 
                                max="120" 
                                step="1"
                                value={videoDuration}
                                onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                                className="h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 w-full"
                              />
                            </div>

                            <div className="bg-white border border-slate-200 p-4 rounded-3xl flex flex-col gap-2 shadow-sm min-w-[170px]">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <Layers size={12} className="text-violet-600" />
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">عدد المشاهد</span>
                                </div>
                                <span className="text-xs font-bold text-violet-600">{sceneCount}</span>
                              </div>
                              <input 
                                type="range" 
                                min="3" 
                                max="15" 
                                step="1"
                                value={sceneCount}
                                onChange={(e) => setSceneCount(parseInt(e.target.value))}
                                className="h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600 w-full"
                              />
                            </div>
                          </>
                        )}

                        <div className="bg-white border border-slate-200 p-4 rounded-3xl flex flex-col gap-2 shadow-sm min-w-[140px]">
                           <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Zap size={12} className="text-amber-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">سرعة المحرك</span>
                              </div>
                              <span className="text-[10px] font-bold text-amber-600 uppercase">{modelType === 'flash' ? 'سريع جداً' : 'دقة فائقة'}</span>
                           </div>
                           <div className="flex bg-slate-50 p-1 rounded-xl">
                              <button onClick={() => setModelType('flash')} className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-tighter rounded-lg transition-all ${modelType === 'flash' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Flash</button>
                              <button onClick={() => setModelType('pro')} className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-tighter rounded-lg transition-all ${modelType === 'pro' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Pro</button>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 overflow-x-auto pb-4 scrollbar-hide no-scrollbar relative z-10" dir="rtl">
                      {(Object.keys(styleLabels) as VideoStyle[]).map((key) => {
                        const label = styleLabels[key];
                        const Icon = {
                          cinematic: Film,
                          netflix: Monitor,
                          hollywood: Star,
                          bollywood: Music,
                          egyptian: Flame,
                          syrian: Drama,
                          saudi: Palmtree,
                          vlog: Camera,
                          dramatic: Theater,
                          educational: BookOpen,
                          horror: Ghost
                        }[key] || Sparkles;

                        const isActive = videoStyle === key;

                        return (
                          <button
                            key={key}
                            onClick={() => setVideoStyle(key)}
                            className={`px-5 py-3 rounded-2xl border flex items-center gap-3 transition-all whitespace-nowrap font-display text-[10px] font-black uppercase tracking-widest group ${
                              isActive 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/30' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-slate-50'
                            }`}
                          >
                            <Icon size={16} className={`${isActive ? 'text-white' : 'text-indigo-500 group-hover:scale-110 transition-transform'}`} />
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-600/5 blur-3xl opacity-50" />
                      <div className="relative bg-white border border-slate-200 rounded-3xl p-3 flex flex-col md:flex-row gap-3 shadow-xl overflow-hidden backdrop-blur-sm">
                        {modelType === 'pro' && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20" />
                        )}
                        <div className="flex-1 flex items-center px-4 py-4 md:py-0">
                          <input
                            type="text"
                            placeholder="اكتب بذرة القصة هنا.. (مثال: صراع بين أخوين على إرث قديم ينتهي باكتشاف صادم)"
                            className="w-full bg-transparent outline-none text-xl text-slate-800 placeholder:text-slate-300 font-display font-medium text-right"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && generateContent()}
                          />
                        </div>
                        <div className="flex items-center gap-2 pr-2">
                           <button 
                             onClick={() => setShowCharConfig(!showCharConfig)}
                             className={`p-4 rounded-2xl transition-all flex items-center gap-2 border ${showCharConfig ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'}`}
                             title="إعدادات ثبات الشخصية"
                           >
                              <User size={20} />
                              <span className="hidden md:inline font-display text-[10px] font-extrabold uppercase tracking-wider">ثبات الشخصية</span>
                           </button>
                           <button 
                             onClick={generateContent}
                             disabled={isLoading || !input.trim()}
                             className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 px-10 py-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 group shadow-lg shadow-indigo-600/20"
                           >
                             {isLoading ? (
                               <RefreshCw className="animate-spin w-5 h-5 text-white" />
                             ) : (
                               <>
                                 <Sparkles className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                                 <span className="font-display text-sm uppercase tracking-widest font-black text-white">تخليق ذكي</span>
                               </>
                             )}
                           </button>
                        </div>
                      </div>

                      {/* Character Consistency Config Panel */}
                      <AnimatePresence>
                        {showCharConfig && (
                          <motion.div 
                            initial={{ opacity: 0, y: -20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -20, height: 0 }}
                            className="overflow-hidden mt-6"
                          >
                            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl space-y-8">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                  <h3 className="text-xl font-display font-black text-slate-900 capitalize">مصفوفة هويات الشخصيات</h3>
                                </div>
                                <button 
                                  onClick={addCharacter}
                                  className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-display font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                                >
                                  <Plus size={14} /> إضافة شخصية
                                </button>
                              </div>

                              <div className="space-y-10 font-display">
                                {characters.map((char, index) => (
                                  <motion.div 
                                    key={char.id} 
                                    initial={{ opacity: 0, x: 20 }} 
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-6 bg-slate-50 border border-slate-100 rounded-2xl relative group/char"
                                  >
                                    <div className="absolute -top-3 right-6 bg-slate-900 text-white text-[8px] font-mono font-black uppercase px-3 py-1 rounded-full border-2 border-white">
                                      شخصية {index + 1}
                                    </div>
                                    
                                    {characters.length > 1 && (
                                      <button 
                                        onClick={() => removeCharacter(char.id)}
                                        className="absolute -top-3 left-6 p-2 bg-white border border-red-100 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm opacity-0 group-hover/char:opacity-100"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">الاسم / Name</label>
                                        <input 
                                          type="text" 
                                          className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-display text-xs font-bold"
                                          placeholder="e.g. Sarah"
                                          value={char.name}
                                          onChange={(e) => updateCharacter(char.id, { name: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">العمر / Age</label>
                                        <input 
                                          type="text" 
                                          className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-display text-xs font-bold"
                                          placeholder="e.g. 25 years old"
                                          value={char.age}
                                          onChange={(e) => updateCharacter(char.id, { age: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">الجنس / Gender</label>
                                        <input 
                                          type="text" 
                                          className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-display text-xs font-bold"
                                          placeholder="e.g. Female"
                                          value={char.gender}
                                          onChange={(e) => updateCharacter(char.id, { gender: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">الشعر / Hair</label>
                                        <input 
                                          type="text" 
                                          className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-display text-xs font-bold"
                                          placeholder="e.g. Blonde short hair"
                                          value={char.hair}
                                          onChange={(e) => updateCharacter(char.id, { hair: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">الملابس / Clothing</label>
                                        <input 
                                          type="text" 
                                          className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-display text-xs font-bold"
                                          placeholder="e.g. Smart casual suit"
                                          value={char.clothing}
                                          onChange={(e) => updateCharacter(char.id, { clothing: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">أخرى / Other</label>
                                        <input 
                                          type="text" 
                                          className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-display text-xs font-bold"
                                          placeholder="e.g. Glasses, beard"
                                          value={char.other}
                                          onChange={(e) => updateCharacter(char.id, { other: e.target.value })}
                                        />
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-400 font-display font-bold bg-indigo-50/30 p-3 rounded-lg border border-indigo-100/50 text-right">
                                * سيتم دمج خصائص الشخصيات لضمان التناسق البصري عبر الفيديو.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </section>

                  {/* Output Interface */}
                  <section className="min-h-[500px]">
                    {error && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border-2 border-red-100 p-8 rounded-[2rem] flex flex-col items-center text-center gap-6 shadow-xl mb-10 overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20" />
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 animate-pulse">
                          <AlertCircle size={32} />
                        </div>
                        <div className="space-y-2 max-w-lg">
                          <h3 className="text-xl font-display font-black text-slate-900 line-clamp-1">تنبيه من النظام</h3>
                          <p className="text-slate-600 leading-relaxed font-display font-medium text-sm">
                            {error}
                          </p>
                        </div>
                        
                        {(error.includes("Quota") || error.includes("حصة") || error.includes("API")) && (
                          <button 
                            onClick={handleOpenKeyDialog}
                            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-display font-bold flex items-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
                          >
                            <Key size={16} /> تفعيل مفتاح API الخاص بك
                          </button>
                        )}
                      </motion.div>
                    )}

                    <AnimatePresence mode="popLayout">
                      {activeTool === 'ideas' ? (
                        <IdeaGenerator 
                          ideas={result?.ideas || []} 
                          onGenerate={handleIdeaGenerate} 
                          onUseIdea={handleUseIdea} 
                          isLoading={isLoading} 
                        />
                      ) : isLoading && !result ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-12">
                          <div className="relative">
                            <div className="w-32 h-32 border border-slate-200 rounded-full animate-[spin_3s_linear_infinite]" />
                            <div className="w-24 h-24 border-t-2 border-indigo-600 rounded-full absolute top-4 left-4 animate-spin" />
                            <Sparkles className="w-10 h-10 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          </div>
                          <div className="text-center space-y-4">
                            <h3 className="font-display text-xs text-indigo-600 font-extrabold uppercase tracking-[0.5em] animate-pulse">جاري تخليق الحالة الإبداعية</h3>
                            <div className="flex gap-1.5 justify-center">
                              {[1,2,3,4].map(i => <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, delay: i * 0.2 }} className="w-2.5 h-2.5 bg-indigo-200 rounded-full" />)}
                            </div>
                          </div>
                        </div>
                      ) : result ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`space-y-10 pb-20 relative transition-opacity duration-500 ${isLoading ? 'opacity-40' : 'opacity-100'}`}>
                          {isLoading && (
                            <div className="sticky top-0 z-50 py-4 mb-4">
                               <div className="bg-white/80 backdrop-blur-md border border-indigo-100 rounded-3xl p-4 flex items-center justify-between shadow-2xl animate-bounce">
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                     <RefreshCw size={20} className="animate-spin" />
                                   </div>
                                   <div>
                                     <p className="text-xs font-display font-extrabold text-slate-900">جاري التحديث الذكي...</p>
                                     <p className="text-[10px] text-slate-400 font-mono">Neural_Pipeline_Active</p>
                                   </div>
                                 </div>
                               </div>
                            </div>
                          )}
                          <ToolNavigation activeTool={activeTool} setActiveTool={setActiveTool} result={result} />
                          <AnimatePresence mode="wait">
                            {activeTool === 'script' && (
                              <motion.div 
                                key="script-view"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="grid gap-10"
                              >
                                {/* Header Card */}
                                <div className="bg-white border border-slate-200 p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                                    <div className="space-y-4">
                                      <div className="flex flex-wrap items-center gap-3">
                                        <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-display font-black tracking-widest rounded-lg shadow-sm uppercase">نــشط</span>
                                        {result.characterSheet && (
                                          <span className="px-3 py-1 bg-violet-600/10 text-violet-600 text-[9px] font-display font-black tracking-widest rounded-lg border border-violet-500/10 uppercase flex items-center gap-2">
                                            <User size={12} /> استقرار الشخصيات
                                          </span>
                                        )}
                                        <h3 className="text-3xl font-display font-black text-slate-900 mt-2 md:mt-0">{result.title}</h3>
                                      </div>
                                      {result.plotArc && (
                                        <div className="bg-slate-50 border-r-4 border-indigo-600 p-4 rounded-l-2xl">
                                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">المسار الدرامي • PLOT ARCHITECTURE</p>
                                          <p className="text-sm text-slate-600 leading-relaxed font-display">{result.plotArc}</p>
                                        </div>
                                      )}
                                    </div>
                                  <div className="flex flex-wrap gap-3">
                                    <ActionButton 
                                      icon={activeGeneration['global-music'] === 'music' ? <RefreshCw className="animate-spin text-white" /> : <Music size={16} className="text-white" />} 
                                      onClick={generateGlobalMusic} 
                                      label={mediaResults['global-music'] ? "تحديث التراك" : "تخليق الأوست (OST)"} 
                                    />
                                    <button onClick={copyFullScript} className="px-5 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-2xl flex items-center gap-3 text-white transition-all shadow-lg active:scale-95 group">
                                      <Copy size={16} className="group-hover:scale-110 transition-transform" />
                                      <span className="text-[11px] font-display font-bold uppercase tracking-widest">نسخ النص</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Scenes Grid */}
                                <div className="grid gap-6">
                                  {result.script?.map((scene, i) => (
                                    <SceneCard 
                                      key={i} 
                                      scene={scene} 
                                      onGenImage={() => generateSceneImage(scene.id, scene.visual)}
                                      onGenAudio={() => generateSceneAudio(scene.id, scene.audio)}
                                      onGenVideo={() => generateSceneVideo(scene.id, scene.visual)}
                                      onUpdate={(updates) => updateScene(scene.id, updates)}
                                      isGenerating={activeGeneration[scene.id] || null}
                                      media={mediaResults[scene.id] || null}
                                      videoMedia={mediaResults[`video-${scene.id}`] || null}
                                      audioUrl={mediaResults[`audio-${scene.id}`]?.url || null}
                                      aspectRatio={aspectRatio}
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            )}

                            {activeTool === 'prompt' && result.prompt && (
                              <motion.div 
                                key="prompt-view"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white border border-slate-200 p-10 rounded-3xl space-y-10 relative overflow-hidden group shadow-sm transition-all hover:shadow-md"
                              >
                                <div className="absolute top-0 right-0 p-6">
                                  <button onClick={() => handleCopy(result.prompt!)} className="w-12 h-12 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm">
                                    {copied ? <Check size={20} /> : <Copy size={20} className="text-slate-500 group-hover:text-white" />}
                                  </button>
                                </div>
                                <div className="space-y-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                    <span className="font-mono text-xs text-slate-500 uppercase tracking-[0.4em]">المطالبة البصرية المتكاملة</span>
                                  </div>
                                  <p className="text-2xl leading-relaxed text-slate-900 font-display font-medium italic" dir="ltr">"{result.prompt}"</p>
                                </div>
                                <div className="pt-8 border-t border-slate-100 flex flex-wrap gap-4">
                                  <Tag label="إضاءة: حجمية" />
                                  <Tag label="بصريات: أنامورفيك" />
                                  <Tag label="حركة: 24 إطار" />
                                  <Tag label="لون: تدرج سينمائي" />
                                </div>
                              </motion.div>
                            )}

                            {activeTool === 'metadata' && (
                              <motion.div 
                                key="metadata-view"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="grid md:grid-cols-5 gap-8"
                              >
                                <div className="md:col-span-3 space-y-8">
                                  <ContentBlock label="مانشيت رائج" content={result.title || ''} onCopy={handleCopy} big />
                                  <ContentBlock label="الوصف الكامل" content={result.description || ''} onCopy={handleCopy} />
                                </div>
                                <div className="md:col-span-2 space-y-8">
                                  <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-6 shadow-sm">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">تاقات المنصة</label>
                                      <div className="flex flex-wrap gap-2 pt-2">
                                        {result.tags?.map((t, i) => (
                                          <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-display font-bold hover:bg-indigo-100 transition-colors cursor-pointer">#{t}</span>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">معاينة YouTube Mockup</label>
                                      <div className={`${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'} bg-slate-900 rounded-2xl overflow-hidden relative group shadow-lg`}>
                                         <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer">
                                            <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl">
                                              <Play size={24} />
                                            </div>
                                         </div>
                                         <div className="p-4 space-y-2 absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-900/90 to-transparent">
                                            <h4 className="text-white text-xs font-display font-black line-clamp-1">{result.title}</h4>
                                            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                                              <div className="w-1/3 h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                            </div>
                                         </div>
                                      </div>
                                    </div>
                                    <div className="space-y-2 pt-4 border-t border-slate-100">
                                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">تسمية توضيحية اجتماعية</label>
                                      <p className="text-sm text-slate-600 leading-relaxed font-display font-medium italic">"{result.caption}"</p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                        </AnimatePresence>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="flex flex-col items-center justify-center py-40 space-y-12"
                      >
                         <div className="relative w-40 h-40">
                           <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] animate-pulse" />
                           <motion.div 
                             animate={{ rotate: 360 }} 
                             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                             className="w-full h-full border-2 border-dashed border-slate-200 rounded-full"
                           />
                           <div className="absolute inset-0 flex items-center justify-center">
                             <Sparkles className="w-12 h-12 text-slate-300" />
                           </div>
                         </div>
                         <div className="text-center space-y-4 max-w-md mx-auto font-display">
                           <h3 className="text-xs uppercase tracking-[0.6em] text-indigo-600 font-black">غرفة الانتظار الذكية</h3>
                           <p className="text-slate-500 font-light text-xl leading-relaxed">
                             ابدأ بتغذية المحرك بفكرة جديدة، وسأقوم بتحويلها بذكاء إلى تجربة سينمائية متكاملة.
                           </p>
                           <div className="pt-8 flex justify-center gap-4">
                             <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-mono text-slate-400 uppercase tracking-widest shadow-sm">v4.0_flash_next</span>
                           </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  </div>
  );
}
