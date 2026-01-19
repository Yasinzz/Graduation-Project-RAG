# 🎓 Graduation Project: Vertical Domain RAG System
> 基于检索增强生成（RAG）的垂直领域问答系统 | 2026届毕业设计

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![LangChain](https://img.shields.io/badge/Framework-LangChain-green)
![Status](https://img.shields.io/badge/Status-Developing-orange)

## 📖 项目简介 (Introduction)
本项目旨在解决传统 LLM 在特定垂直领域（如医疗/法律/金融）产生幻觉的问题。通过构建向量数据库和检索管道，实现基于私有知识库的高准确度问答。

## 🛠️ 技术架构 (Architecture)
- **LLM**: OpenAI GPT-3.5 / Llama 2 / ChatGLM3
- **Embedding**: text-embedding-ada-002 / BGE-Large
- **Vector DB**: ChromaDB / Milvus / Faiss
- **Orchestration**: LangChain / LlamaIndex

## 🚀 快速开始 (Quick Start)

### 1. 环境准备
```bash
# 克隆项目
git clone [https://github.com/你的用户名/Final-Project-RAG.git](https://github.com/你的用户名/Final-Project-RAG.git)

# 安装依赖
pip install -r requirements.txt
