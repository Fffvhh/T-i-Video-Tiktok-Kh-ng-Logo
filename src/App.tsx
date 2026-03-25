import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Link as LinkIcon, 
  Video, 
  Music, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  History, 
  Trash2, 
  Zap, 
  ShieldCheck, 
  Smartphone,
  ChevronRight,
  Play,
  X,
  Copy,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for Tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TikTokData {
  id: string;
  title: string;
  cover: string;
  origin_cover: string;
  play: string;
  wmplay: string;
  hdplay: string;
  music: string;
  music_info: {
    title: string;
    author: string;
    cover: string;
  };
  author: {
    id: string;
    unique_id: string;
    nickname: string;
    avatar: string;
  };
  duration: number;
  play_count: number;
  digg_count: number;
  comment_count: number;
  share_count: number;
  download_count: number;
}

interface HistoryItem {
  id: string;
  title: string;
  cover: string;
  author: string;
  timestamp: number;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<TikTokData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);

  // Clipboard detection logic
  const checkClipboard = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    
    try {
      // Some browsers require permission or a user gesture
      const text = await navigator.clipboard.readText();
      const isTikTok = text && (text.includes('tiktok.com') || text.includes('douyin.com'));
      if (isTikTok && text !== url && !videoData) {
        setDetectedUrl(text);
      } else {
        setDetectedUrl(null);
      }
    } catch (err) {
      // Silently fail if permission denied
      console.debug('Clipboard access denied');
    }
  };

  useEffect(() => {
    // Check on mount
    const timer = setTimeout(checkClipboard, 1000);
    
    // Check when window gets focus
    window.addEventListener('focus', checkClipboard);
    return () => {
      window.removeEventListener('focus', checkClipboard);
      clearTimeout(timer);
    };
  }, [url, videoData]);

  const handlePasteDetected = () => {
    if (detectedUrl) {
      setUrl(detectedUrl);
      setDetectedUrl(null);
      // Automatically trigger fetch
      handleFetch(undefined, detectedUrl);
    }
  };

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('tikflow_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (data: TikTokData) => {
    const newItem: HistoryItem = {
      id: data.id,
      title: data.title || "Video TikTok",
      cover: data.cover,
      author: data.author.unique_id,
      timestamp: Date.now(),
    };

    const updatedHistory = [newItem, ...history.filter(item => item.id !== data.id)].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('tikflow_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('tikflow_history');
  };

  const handleFetch = async (e?: React.FormEvent, fetchUrl?: string) => {
    if (e) e.preventDefault();
    const targetUrl = fetchUrl || url;
    if (!targetUrl.trim()) return;

    setLoading(true);
    setError(null);
    setVideoData(null);

    try {
      const response = await fetch('/api/tiktok/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không tìm thấy video. Vui lòng kiểm tra lại liên kết.');
      }

      setVideoData(data);
      saveToHistory(data);
      if (fetchUrl) setUrl(fetchUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    // Use the proxy endpoint to ensure reliable download with correct headers
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `https://www.tikwm.com${fileUrl}`;
    const proxyUrl = `/api/proxy/download?url=${encodeURIComponent(fullUrl)}&filename=${encodeURIComponent(fileName)}`;
    
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyDownloadLink = (fileUrl: string) => {
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `https://www.tikwm.com${fileUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-500/20">
      {/* Blue Header Section */}
      <div className="bg-[#0066FF] text-white pb-12">
        {/* Simple Navigation */}
        <nav className="h-16 flex items-center justify-between max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#0066FF] fill-[#0066FF]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TikFlow<span className="opacity-80">Elite</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
              title="Lịch sử"
            >
              <History className="w-5 h-5 text-white" />
              {history.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-400 rounded-full border-2 border-[#0066FF]" />
              )}
            </button>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-6 pt-10 md:pt-14">
          {/* Hero Section */}
          <section className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3">
                TikFlowElite Tải Video TikTok
              </h1>
              <p className="text-base opacity-90 max-w-xl mx-auto font-medium">
                Tải video TikTok HD không watermark - logo - miễn phí
              </p>
            </motion.div>
          </section>

          {/* Search Input */}
          <section className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <AnimatePresence>
                {detectedUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="mb-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center justify-between shadow-lg"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-green-400/20 rounded-xl flex items-center justify-center shrink-0">
                        <LinkIcon className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-0.5">Phát hiện liên kết mới</p>
                        <p className="text-sm text-white/80 truncate font-medium">{detectedUrl}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <button
                        onClick={() => setDetectedUrl(null)}
                        className="p-2 text-white/50 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handlePasteDetected}
                        className="px-4 py-2 bg-white text-[#0066FF] rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-sm active:scale-[0.98]"
                      >
                        Tải ngay
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleFetch} className="relative flex flex-col gap-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <LinkIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Dán liên kết TikTok tại đây..."
                    className="block w-full pl-12 pr-24 py-3.5 md:py-4 bg-white border border-transparent rounded-2xl text-gray-900 placeholder:text-gray-400 focus:ring-4 focus:ring-white/20 transition-all text-base shadow-xl"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-2">
                    {url && (
                      <button 
                        type="button"
                        onClick={() => setUrl('')}
                        className="p-2 text-gray-300 hover:text-gray-500"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={async () => {
                        try {
                          if (!navigator.clipboard) {
                            throw new Error('Clipboard API not available');
                          }
                          const text = await navigator.clipboard.readText();
                          setUrl(text);
                        } catch (err) {
                          console.error('Failed to read clipboard', err);
                          setError('Không thể truy cập bộ nhớ tạm. Vui lòng dán liên kết bằng tay (Ctrl+V).');
                          setTimeout(() => setError(null), 5000);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Dán</span>
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !url}
                  className={cn(
                    "w-full py-3.5 md:py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg",
                    loading || !url
                      ? "bg-white/20 text-white/40 cursor-not-allowed shadow-none"
                      : "bg-[#00B359] text-white hover:bg-[#00994D] active:scale-95 shadow-green-600/20"
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span className="text-lg">Tải xuống</span>
                    </>
                  )}
                </button>

                {/* Quality Badges - Compact & Clear */}
                <div className="flex flex-wrap justify-center gap-2 mt-1">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-white/60 border border-white/5">
                    <Zap className="w-2.5 h-2.5 text-yellow-400/70 fill-yellow-400/30" />
                    <span>HD Quality</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-white/60 border border-white/5">
                    <Zap className="w-2.5 h-2.5 text-blue-400/70 fill-blue-400/30" />
                    <span>4K Ultra</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-white/60 border border-white/5">
                    <Music className="w-2.5 h-2.5 text-pink-400/70" />
                    <span>MP3 Audio</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-white/60 border border-white/5">
                    <ShieldCheck className="w-2.5 h-2.5 text-green-400/70" />
                    <span>No Logo</span>
                  </div>
                </div>
              </form>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6"
                  >
                    <div className="flex flex-col md:flex-row items-center gap-4 text-white bg-red-500/20 border border-white/10 p-4 rounded-xl backdrop-blur-md">
                      <div className="flex items-center gap-3 flex-1">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-semibold">{error}</p>
                      </div>
                      <button 
                        onClick={() => handleFetch()}
                        className="px-4 py-2 bg-white text-red-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
                      >
                        Thử lại
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </section>
        </main>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12">

        {/* Results - Exact Match to User Image */}
        <AnimatePresence mode="wait">
          {videoData && (
            <motion.section
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="max-w-xl mx-auto space-y-4"
            >
              {/* Video Info Card - Lavender/Grey background */}
              <div className="bg-[#E9E9F0] rounded-2xl p-4 flex gap-4 items-start shadow-sm">
                <div className="relative shrink-0">
                  <img
                    src={videoData.cover}
                    alt={videoData.title}
                    className="w-24 h-24 rounded-2xl object-cover shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h2 className="text-[17px] font-bold text-[#1A1A1A] line-clamp-2 leading-tight mb-2">
                    {videoData.title || "Video TikTok"}
                  </h2>
                  <p className="text-[15px] text-[#666666] font-medium">@{videoData.author.unique_id}</p>
                </div>
              </div>

              {/* Download Buttons - Matching Image Style */}
              <div className="space-y-3 pt-2">
                {(videoData.hdplay || videoData.play) && (
                  <>
                    {videoData.hdplay && (
                      <button
                        onClick={() => downloadFile(videoData.hdplay, `tikflow_4k_${videoData.id}.mp4`)}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-[#0066FF] text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-md active:scale-[0.99]"
                      >
                        <Download className="w-6 h-6" />
                        <div className="flex flex-col items-start leading-none">
                          <span>Download 4K Ultra</span>
                          <span className="text-[10px] opacity-70 uppercase tracking-widest mt-1">Server 1 - High Quality</span>
                        </div>
                      </button>
                    )}
                    <button
                      onClick={() => downloadFile(videoData.play || videoData.hdplay, `tikflow_hd_${videoData.id}.mp4`)}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600/90 text-white rounded-xl font-bold text-lg hover:bg-blue-600 transition-all shadow-md active:scale-[0.99]"
                    >
                      <Download className="w-6 h-6" />
                      <div className="flex flex-col items-start leading-none">
                        <span>Download HD</span>
                        <span className="text-[10px] opacity-70 uppercase tracking-widest mt-1">Server 2 - Stable</span>
                      </div>
                    </button>
                  </>
                )}

                <button
                  onClick={() => downloadFile(videoData.music, `tikflow_audio_${videoData.id}.mp3`)}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-900 transition-all shadow-md active:scale-[0.99]"
                >
                  <Download className="w-6 h-6" />
                  <span>Download MP3</span>
                </button>

                {/* Black Screen Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-normal">
                    Nếu video bị đen khi tải bản 4K, vui lòng thử tải <strong>Server 2 (HD)</strong>. Một số thiết bị cũ không hỗ trợ định dạng 4K của TikTok.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setVideoData(null);
                    setUrl('');
                  }}
                  className="w-full flex items-center justify-center py-4 bg-[#0F0F0F] text-white rounded-xl font-bold text-lg hover:bg-black transition-all shadow-md active:scale-[0.99]"
                >
                  <span>Download other video</span>
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex justify-center gap-8 pt-4">
                <button 
                  onClick={() => copyDownloadLink(videoData.hdplay || videoData.play)}
                  className="text-xs font-bold text-gray-400 hover:text-blue-600 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Sao chép link
                </button>
                <button 
                  onClick={() => setShowPreview(true)}
                  className="text-xs font-bold text-gray-400 hover:text-blue-600 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
                >
                  <Play className="w-3.5 h-3.5" />
                  Xem thử
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* How to Download Section */}
        {!videoData && (
          <>
            <section className="mt-24 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Cách tải video TikTok</h2>
              <div className="space-y-12">
                {[
                  { step: 1, title: 'Copy link', desc: 'Mở TikTok → chọn video → nhấn Chia sẻ → Sao chép liên kết.' },
                  { step: 2, title: 'Dán link', desc: 'Dán liên kết vào ô nhập liệu ở trên và nhấn nút Tải xuống.' },
                  { step: 3, title: 'Tải về', desc: 'Chọn định dạng bạn muốn (Video hoặc MP3) để lưu về máy.' },
                ].map((s) => (
                  <div key={s.step} className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-blue-600/20">
                      {s.step}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Bước {s.step}: {s.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Detailed Terms of Service Section */}
            <section className="mt-32 max-w-4xl mx-auto px-6 py-16 bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-blue-500/5">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Điều khoản sử dụng</h2>
                <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Cập nhật lần cuối: Tháng 1, 2025</p>
              </div>

              <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-xs">1</span>
                    Chấp nhận điều khoản
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    Bằng việc truy cập và sử dụng <strong>TikFlowElite</strong>, bạn đồng ý tuân thủ các Điều khoản sử dụng này. Nếu bạn không đồng ý với bất kỳ phần nào của điều khoản, vui lòng không sử dụng dịch vụ của chúng tôi.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-xs">2</span>
                    Mô tả dịch vụ
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    <strong>TikFlowElite</strong> cung cấp dịch vụ tải video TikTok không logo miễn phí. Dịch vụ cho phép người dùng:
                  </p>
                  <ul className="text-gray-500 text-sm space-y-1 list-disc pl-5">
                    <li>Tải video TikTok không có watermark</li>
                    <li>Tải slideshow TikTok dưới dạng video MP4</li>
                    <li>Trích xuất âm thanh từ video TikTok sang định dạng MP3</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-xs">3</span>
                    Sử dụng hợp pháp
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    Bạn đồng ý chỉ sử dụng dịch vụ cho các mục đích hợp pháp:
                  </p>
                  <ul className="text-gray-500 text-sm space-y-1 list-disc pl-5">
                    <li>Chỉ tải xuống nội dung mà bạn có quyền sử dụng hoặc nội dung công khai</li>
                    <li>Không sử dụng cho mục đích thương mại khi chưa được phép</li>
                    <li>Tôn trọng quyền sở hữu trí tuệ của người tạo nội dung</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-xs">4</span>
                    Quyền sở hữu trí tuệ
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    Tất cả nội dung trên TikTok thuộc quyền sở hữu của người tạo nội dung hoặc TikTok.
                  </p>
                  <ul className="text-gray-500 text-sm space-y-1 list-disc pl-5">
                    <li>Không lưu trữ video trên máy chủ của chúng tôi</li>
                    <li>Không sở hữu bất kỳ nội dung nào được tải xuống</li>
                    <li>Chỉ cung cấp công cụ kỹ thuật để tải xuống công khai</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-xs">5</span>
                    DMCA và gỡ bỏ
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    Nếu bạn là chủ sở hữu bản quyền và tin rằng quyền của bạn bị vi phạm, vui lòng liên hệ với chúng tôi qua email với các thông tin: Mô tả nội dung, URL gốc, thông tin liên hệ và tuyên bố sở hữu hợp pháp.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-xs">6</span>
                    Giới hạn trách nhiệm
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    Dịch vụ được cung cấp "nguyên trạng". Chúng tôi không chịu trách nhiệm về nội dung tải xuống, việc sử dụng sai mục đích hoặc bất kỳ thiệt hại nào phát sinh từ việc sử dụng dịch vụ.
                  </p>
                </div>
              </div>

              <div className="mt-16 pt-10 border-t border-gray-50 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">7. Thay đổi dịch vụ</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">Có quyền tạm ngừng hoặc chấm dứt dịch vụ bất cứ lúc nào.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">8. Thay đổi điều khoản</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">Có thể cập nhật điều khoản theo thời gian.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">9. Liên hệ</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">Vui lòng liên hệ qua email hỗ trợ của chúng tôi.</p>
                </div>
              </div>

              <div className="mt-12 flex justify-center">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl text-xs font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Cam kết an toàn & bảo mật tuyệt đối</span>
                </div>
              </div>
            </section>
          </>
        )}

        {/* History Overlay */}
        <AnimatePresence>
          {showHistory && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-[101] shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Lịch sử tải</h2>
                  <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-50 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {history.length > 0 ? (
                    history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleFetch(undefined, `https://www.tiktok.com/@${item.author}/video/${item.id}`);
                          setShowHistory(false);
                        }}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all text-left group"
                      >
                        <img src={item.cover} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate">@{item.author}</p>
                          <p className="text-xs text-gray-400 truncate">{item.title}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-300">
                      <History className="w-12 h-12 mb-2 opacity-20" />
                      <p className="text-sm font-medium">Trống</p>
                    </div>
                  )}
                </div>
                {history.length > 0 && (
                  <div className="p-6 border-t border-gray-100">
                    <button onClick={clearHistory} className="w-full py-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors uppercase tracking-widest">
                      Xóa lịch sử
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Video Preview Modal */}
        <AnimatePresence>
          {showPreview && videoData && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPreview(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-lg aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl"
              >
                <video 
                  src={videoData.play} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain"
                />
                <button 
                  onClick={() => setShowPreview(false)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Simple Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-gray-100 text-center">
        <p className="text-sm font-bold text-gray-900 mb-4">TikFlow Elite</p>
        <div className="flex justify-center gap-6 text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
          <a href="#" className="hover:text-blue-600">Điều khoản</a>
          <a href="#" className="hover:text-blue-600">Bảo mật</a>
          <a href="#" className="hover:text-blue-600">Liên hệ</a>
        </div>
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
          &copy; 2026 TikFlow Elite &bull; Made with Precision
        </p>
      </footer>
    </div>
  );
}
