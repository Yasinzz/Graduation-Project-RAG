import os
# --- 1. 【魔法代码】设置国内镜像源 (解决 HuggingFace 连不上的问题) ---
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'

# --- 2. 正常的 Import ---
from langchain_community.document_loaders import Docx2txtLoader, PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain_community.vectorstores import FAISS

# --- 3. 配置路径 ---
DATA_PATH = "./data"
DB_PATH = "./vector_db"

# --- 4. 加载文档 ---
def load_documents():
    documents = []
    if not os.path.exists(DATA_PATH):
        os.makedirs(DATA_PATH)
        print(f"⚠️ 请将你的 .docx 或 .pdf 文件放入 {DATA_PATH} 文件夹中！")
        return []

    for file in os.listdir(DATA_PATH):
        if file.startswith("~$"): # 跳过临时文件
            continue
            
        file_path = os.path.join(DATA_PATH, file)
        ext = os.path.splitext(file)[1].lower()
        
        loader = None
        if ext == ".docx":
            loader = Docx2txtLoader(file_path)
        elif ext == ".pdf":
            loader = PyPDFLoader(file_path)
        elif ext == ".txt":
            loader = TextLoader(file_path, encoding="utf-8")
            
        if loader:
            try:
                print(f"正在加载文件: {file}...")
                documents.extend(loader.load())
            except Exception as e:
                print(f"❌ 跳过损坏文件: {file} ({e})")
                
    return documents

# --- 5. 主函数 ---
def create_vector_db():
    docs = load_documents()
    if not docs:
        print("⚠️ 没找到文档，请检查 data 文件夹。")
        return

    print(f"正在切分 {len(docs)} 份文档...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=200)
    split_docs = text_splitter.split_documents(docs)
    print(f"共切分为 {len(split_docs)} 个片段。")

    print("正在下载 Embedding 模型 (使用国内镜像)...")
    try:
        # 尝试使用 GPU
        embeddings = HuggingFaceBgeEmbeddings(
            model_name="BAAI/bge-small-zh-v1.5",
            model_kwargs={'device': 'cuda'},
            encode_kwargs={'normalize_embeddings': True}
        )
    except:
        print("GPU 加载失败，切换回 CPU 模式 (这很正常，不影响使用)...")
        embeddings = HuggingFaceBgeEmbeddings(
            model_name="BAAI/bge-small-zh-v1.5",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )

    print("正在构建索引...")
    db = FAISS.from_documents(split_docs, embeddings)
    db.save_local(DB_PATH)
    print(f"🎉 成功！知识库已保存到 {DB_PATH}")

if __name__ == "__main__":
    create_vector_db()