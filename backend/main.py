import os
import asyncio
# ==========================================
# ⚡️ 网络环境配置
# ==========================================
# 1. 允许访问 HuggingFace 镜像 (下载模型用)
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'

# 2. 强制本地流量不走代理 (解决 502/404 报错的关键)
os.environ['NO_PROXY'] = 'localhost,127.0.0.1,0.0.0.0'

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

# LangChain 相关库
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

app = FastAPI()

# 跨域配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =======================================================
# 全局资源加载
# =======================================================
VECTOR_DB_PATH = "./vector_db"
embeddings = None
vector_store = None
llm = None

@app.on_event("startup")
async def startup_event():
    global embeddings, vector_store, llm
    print("正在初始化系统资源...")
    
    # A. 加载 Embedding
    EMBEDDING_MODEL_NAME = "BAAI/bge-small-zh-v1.5" 
    print(f"1. 加载 Embedding 模型: {EMBEDDING_MODEL_NAME}...")
    try:
        embeddings = HuggingFaceBgeEmbeddings(
            model_name=EMBEDDING_MODEL_NAME,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
    except Exception as e:
        print(f"❌ Embedding 加载失败: {e}")

    # B. 加载向量库
    print(f"2. 加载向量数据库: {VECTOR_DB_PATH}...")
    if os.path.exists(VECTOR_DB_PATH):
        try:
            vector_store = FAISS.load_local(
                VECTOR_DB_PATH, 
                embeddings, 
                allow_dangerous_deserialization=True
            )
            print("✅ 向量库加载成功！")
        except Exception as e:
            print(f"❌ 向量库加载出错: {e}")
    else:
        print("❌ 未找到 vector_db 文件夹，请先运行 ingest.py")

    # C. 连接 Ollama
    print("3. 连接本地 Ollama 服务...")
    llm = ChatOllama(
        model="qwen2.5:7b",  # 确保和你 ollama list 里名字一致
        temperature=0.3,     
    )
    print("✅ 系统初始化完成，等待请求...")


# =======================================================
# RAG 核心生成逻辑 (这里修复了 chain 丢失的问题)
# =======================================================
async def rag_stream_generator(query: str):
    # 1. 检索阶段
    yield "【后端】正在检索知识库...\n"
    await asyncio.sleep(0.1)
    
    if not vector_store:
        yield "❌ 错误：向量库未加载。\n"
        return

    # 使用 MMR 算法检索 (优化匹配度)
    try:
        docs = vector_store.search(
            query, 
            search_type="mmr", 
            k=4, 
            search_kwargs={"fetch_k": 10}
        )
    except Exception as e:
        yield f"❌ 检索出错: {str(e)}\n"
        return
    
    if not docs:
        yield "⚠️ 未找到相关资料，尝试通用回答...\n\n"
        context = "无相关背景知识。"
    else:
        yield f"✅ 已找到 {len(docs)} 条相关资料，正在阅读...\n\n"
        context = "\n\n".join([doc.page_content for doc in docs])

    # 2. 生成阶段 (新版提示词)
    template = """你是一名专业的校园教务助手。你的任务是基于下方的【参考资料】回答同学的问题。

请遵守以下规则：
1. **依据事实**：只能根据【参考资料】的内容回答，严禁使用你自带的通用知识瞎编。
2. **注明来源**：回答时请尽量自然地提及资料来源（例如：“根据教务处文件规定...”）。
3. **诚实原则**：如果【参考资料】中没有包含问题的答案，请直接回复：“抱歉，当前的知识库中未找到相关信息。”
4. **语气风格**：亲切、客观、有条理。

【参考资料】：
{context}

【同学的问题】：
{question}

请开始作答："""

    # -------------------------------------------------------
    # 👇 就是这里！之前报错是因为下面这两行被误删了
    # -------------------------------------------------------
    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | llm | StrOutputParser()
    # -------------------------------------------------------

    # 3. 流式调用
    try:
        async for chunk in chain.astream({"context": context, "question": query}):
            yield chunk
    except Exception as e:
        yield f"\n\n❌ Ollama 调用失败: {str(e)}\n请检查 Ollama 是否在运行。"

@app.get("/chat")
async def chat(query: str):
    print(f"收到请求: {query}")
    return StreamingResponse(rag_stream_generator(query), media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)