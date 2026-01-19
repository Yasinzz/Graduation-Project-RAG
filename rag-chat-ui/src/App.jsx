import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  MessageSquare, 
  User, 
  Loader2, 
  Plus, 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  Calendar, 
  Coffee, 
  FileText,
  ChevronRight
} from 'lucide-react';

function App() {
  // 初始状态为空，这样才能显示“开机欢迎页”
  const [messages, setMessages] = useState([]); 
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(null);
  
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, thinkingStep]);

  // ==========================================
  // RAG 核心逻辑 (保持不变)
  // ==========================================
  const simulateRAGResponse = async (question, setThinkingStep, onChunk, signal) => {
    setThinkingStep('正在连接校园知识库后端...');
    try {
      // 注意：这里连接的是你的本地后端
      const response = await fetch(`http://localhost:8000/chat?query=${encodeURIComponent(question)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: signal,
      });
  
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
      setThinkingStep(null);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        onChunk(text);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('请求已中断');
      } else {
        console.error('API Error:', error);
        setThinkingStep(null);
        onChunk('\n\n❌ **连接失败**：请检查 Python 后端是否运行 (python main.py)。');
      }
    }
  };

  // 发送消息处理
  const handleSend = async (text = inputText) => {
    if (!text.trim() || isLoading) return;

    // 1. 添加用户消息
    const userMessage = { id: Date.now(), type: 'user', text: text };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // 2. 添加机器人占位消息
    const botMessageId = Date.now() + 1;
    setMessages(prev => [...prev, { id: botMessageId, type: 'bot', text: '' }]);

    const abortController = new AbortController();

    // 3. 开始流式请求
    try {
      await simulateRAGResponse(
        userMessage.text,
        setThinkingStep,
        (chunk) => {
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId ? { ...msg, text: msg.text + chunk } : msg
          ));
        },
        abortController.signal
      );
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
      setThinkingStep(null);
    }
  };

  // 点击卡片直接提问
  const handleCardClick = (question) => {
    handleSend(question);
  };

  // 开启新对话
  const startNewChat = () => {
    setMessages([]); // 清空消息，自动回到欢迎页
    setInputText('');
  };

  // ==========================================
  // ✨ 新增：开机引导页组件
  // ==========================================
  const WelcomeScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-8 transform hover:scale-105 transition-transform duration-300">
        <GraduationCap size={48} className="text-white" />
      </div>
      
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
        👋 嗨，我是你的校园 AI 助手
      </h2>
      <p className="text-gray-400 max-w-lg mb-12 text-lg leading-relaxed">
        基于本地 RAG 知识库构建。我可以查校历、问考务、找文件，或是解答关于校园生活的任何疑问。
      </p>

      {/* 快捷提问卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl text-left">
        
        <button 
          onClick={() => handleCardClick("下学期什么时候开学？")}
          className="group p-5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-blue-500/50 rounded-2xl transition-all duration-300 flex items-start gap-4 hover:shadow-lg hover:shadow-blue-900/10"
        >
          <div className="p-3 bg-blue-900/30 text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-200 mb-1 group-hover:text-blue-400 transition-colors">校历安排</h3>
            <p className="text-sm text-gray-500">下学期什么时候开学？寒假放几天？</p>
          </div>
        </button>

        <button 
          onClick={() => handleCardClick("英语四六级报名时间")}
          className="group p-5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-purple-500/50 rounded-2xl transition-all duration-300 flex items-start gap-4 hover:shadow-lg hover:shadow-purple-900/10"
        >
          <div className="p-3 bg-purple-900/30 text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-200 mb-1 group-hover:text-purple-400 transition-colors">考务信息</h3>
            <p className="text-sm text-gray-500">英语四六级报名时间？补考怎么申请？</p>
          </div>
        </button>

        <button 
          onClick={() => handleCardClick("学生手册关于作弊的规定")}
          className="group p-5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-green-500/50 rounded-2xl transition-all duration-300 flex items-start gap-4 hover:shadow-lg hover:shadow-green-900/10"
        >
          <div className="p-3 bg-green-900/30 text-green-400 rounded-xl group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-200 mb-1 group-hover:text-green-400 transition-colors">规章制度</h3>
            <p className="text-sm text-gray-500">学生手册关于作弊的规定？奖学金评定？</p>
          </div>
        </button>

        <button 
          onClick={() => handleCardClick("图书馆开馆时间")}
          className="group p-5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-orange-500/50 rounded-2xl transition-all duration-300 flex items-start gap-4 hover:shadow-lg hover:shadow-orange-900/10"
        >
          <div className="p-3 bg-orange-900/30 text-orange-400 rounded-xl group-hover:scale-110 transition-transform">
            <Coffee size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-200 mb-1 group-hover:text-orange-400 transition-colors">校园生活</h3>
            <p className="text-sm text-gray-500">图书馆几点开门？食堂哪里好吃？</p>
          </div>
        </button>

      </div>
    </div>
  );

  // ==========================================
  // 渲染主界面
  // ==========================================
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* --- 左侧侧边栏 --- */}
      <aside className="w-72 bg-gray-900/50 backdrop-blur-xl border-r border-gray-800 p-5 flex flex-col hidden md:flex z-20">
        {/* Logo区 */}
        <div className="flex items-center gap-4 mb-10 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
            🎓
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">Campus AI</h1>
            <p className="text-[10px] text-gray-400 font-medium">智能问答系统 V1.0</p>
          </div>
        </div>

        {/* 新对话按钮 */}
        <button
          onClick={startNewChat}
          className="group w-full bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-blue-900/20 mb-8 border border-blue-500/50 hover:scale-[1.02]"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-semibold tracking-wide">开启新对话</span>
        </button>

        {/* 历史记录区 */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          <h3 className="text-xs font-bold text-gray-500 mb-4 px-2 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={12} /> 推荐问题
          </h3>
          {['毕业设计格式要求', '第二课堂学分认定', '期末考试缓考流程', '校医院报销政策'].map((item, i) => (
            <div 
              key={i} 
              onClick={() => handleSend(item)}
              className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800/80 p-3 rounded-lg cursor-pointer transition-all text-sm group border border-transparent hover:border-gray-700/50"
            >
              <MessageSquare size={16} className="group-hover:text-blue-400 transition-colors" />
              <span className="truncate">{item}</span>
              <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-500" />
            </div>
          ))}
        </div>

        {/* 底部版权 */}
        <div className="mt-auto pt-6 border-t border-gray-800/50 text-center">
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Powered by RAG & LLM<br/>
            © 2026 计算机学院毕业设计
          </p>
        </div>
      </aside>

      {/* --- 主聊天区域 --- */}
      <main className="flex-1 flex flex-col relative bg-gradient-to-b from-gray-900 to-gray-950">
        
        {/* 顶部导航栏 (移动端) */}
        <header className="md:hidden h-16 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 flex items-center px-4 justify-between sticky top-0 z-30">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">🎓</div>
              <span className="font-bold text-lg">Campus AI</span>
           </div>
           <button onClick={startNewChat} className="p-2 text-gray-400 hover:text-white">
             <Plus size={24} />
           </button>
        </header>

        {/* 聊天内容区 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
          {messages.length === 0 ? (
            // ✨ 如果没消息，显示欢迎页
            <WelcomeScreen />
          ) : (
            // 💬 否则显示消息列表
            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.type === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  {/* 头像 */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border-2 ${
                    msg.type === 'user' 
                      ? 'bg-gray-700 border-gray-600 text-gray-300' 
                      : 'bg-blue-600 border-blue-500 text-white'
                  }`}>
                    {msg.type === 'user' ? <User size={20} /> : <GraduationCap size={20} />}
                  </div>
                  
                  {/* 气泡 */}
                  <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-md ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-gray-800/80 backdrop-blur-sm border border-gray-700 text-gray-100 rounded-tl-none'
                  }`}>
                    <div className="markdown-body text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}

              {/* 思考中状态 */}
              {thinkingStep && (
                <div className="flex gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-blue-500/30">
                    <GraduationCap size={20} className="text-blue-400"/>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl rounded-tl-none p-4 flex items-center gap-3">
                    <Loader2 size={18} className="animate-spin text-blue-400" />
                    <span className="text-sm text-gray-400 font-medium tracking-wide">{thinkingStep}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* --- 底部输入框 --- */}
        <div className="p-4 md:p-6 bg-gray-900/80 backdrop-blur-md border-t border-gray-800 z-20">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative group">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="输入你想了解的校园问题，例如：教务处电话是多少..."
                className="w-full bg-gray-800/50 text-white rounded-2xl pl-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-gray-700 hover:border-gray-600 resize-none h-[64px] md:h-[76px] shadow-inner transition-all placeholder:text-gray-500"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !inputText.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all disabled:opacity-50 disabled:hover:bg-blue-600 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
            <div className="text-center mt-3 flex justify-center items-center gap-2 opacity-60">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
               <p className="text-[10px] text-gray-400 font-medium tracking-wide">
                 系统状态：在线 | 模型：Qwen2.5-7B | 知识库：已连接
               </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;