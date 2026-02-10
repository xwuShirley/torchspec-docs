export interface DocSection {
  id: string;
  title: string;
  category: string;
  content: string;
}

export interface DocCategory {
  name: string;
  sections: DocSection[];
}

const sections: DocSection[] = [
  // ── 概述 ──
  {
    id: "overview",
    title: "概述",
    category: "开始使用",
    content: `
TorchSpec 是一个为投机解码（Speculative Decoding）而生的原生 PyTorch 训练框架。它的核心目标是高效训练草稿模型（Draft Model），使其能够"模仿"目标模型的输出，从而在推理阶段通过投机解码大幅加速生成速度。

TorchSpec 采用异步分离式架构，将推理（由目标模型生成训练数据）和训练（训练草稿模型）两个过程解耦，并将它们调度在不同的 GPU 或节点上并行运行。通过 Ray 进行任务协调，通过 Mooncake 进行高效的张量传输，最大化硬件利用率。
    `,
  },
  {
    id: "installation",
    title: "环境安装",
    category: "开始使用",
    content: `
首先，你需要一个装有 NVIDIA GPU 和 CUDA 的环境。然后，使用 \`build_conda.sh\` 脚本一键创建并配置所需的环境。

\`\`\`bash
# 克隆或解压项目后
cd torchspec-main

# 执行构建脚本
./build_conda.sh
\`\`\`

该脚本会使用 \`micromamba\` 创建一个名为 \`torchspec\` 的 Conda 环境，并安装所有必要的依赖，包括 PyTorch、SGLang、Ray 等。

完成后，激活环境：

\`\`\`bash
micromamba activate torchspec
\`\`\`

你也可以使用 Docker 来运行 TorchSpec：

\`\`\`bash
# 构建 Docker 镜像
cd docker
just build

# 或者直接拉取预构建的镜像
docker pull lightseek/torchspec:latest
\`\`\`
    `,
  },
  {
    id: "quickstart",
    title: "快速启动训练",
    category: "开始使用",
    content: `
\`recipes/\` 目录下提供了一系列开箱即用的训练脚本。以单机双卡（一张训练卡，一张推理卡）运行 Qwen3-8B 模型的草稿模型训练为例：

\`\`\`bash
cd recipes

# 参数 1 1 分别代表使用 1 个 GPU 进行训练，1 个 GPU 进行推理
./run_train_entry_eagle3.sh 1 1
\`\`\`

当你看到类似下面的日志输出时，说明训练已成功启动：

\`\`\`
Epoch 1/30 | Step 1/10000 (1/62 in epoch) | pool=196 | inference=15.8 entries/s | training=0.2 entries/s
\`\`\`

这个脚本会依次完成以下操作：

1. 启动 Ray 集群（如果尚未启动）
2. 启动 \`mooncake_master\` 用于节点间张量通信
3. 根据 \`configs/test_train_entry_eagle3.yaml\` 中的配置，在不同的 GPU 上启动推理服务和训练任务
4. 开始进行草稿模型的蒸馏训练
    `,
  },

  // ── 核心概念 ──
  {
    id: "target-model",
    title: "目标模型 (Target Model)",
    category: "核心概念",
    content: `
目标模型是你希望加速推理的那个功能强大但体积庞大的基础模型，例如 \`Qwen/Qwen3-8B\`。

在 TorchSpec 的训练流程中，目标模型负责：

- 对输入 prompt 进行推理，生成完整的输出序列
- 在推理过程中，捕获每一层的隐状态（hidden states）和输出概率分布（logits）
- 将这些数据作为"教师信号"存入 Mooncake Store，供草稿模型学习

目标模型本身不参与训练，它的权重在整个过程中保持不变。
    `,
  },
  {
    id: "draft-model",
    title: "草稿模型 (Draft Model)",
    category: "核心概念",
    content: `
草稿模型是一个结构更小、推理速度更快的模型。TorchSpec 的核心任务就是训练这个草稿模型，使其能够"模仿"目标模型的输出。

在 Eagle3 架构中，草稿模型通常与目标模型共享 embedding 层和 LM head，但中间的 transformer 层数要少得多（通常只有 1 层）。它的配置文件（如 \`qwen3-8b-eagle3.json\`）定义了草稿模型的结构：

\`\`\`json
{
  "architectures": ["LlamaForCausalLMEagle3"],
  "num_hidden_layers": 1,
  "hidden_size": 4096,
  "num_attention_heads": 32,
  "num_key_value_heads": 8,
  "vocab_size": 151936
}
\`\`\`

如果你不提供草稿模型配置（\`draft_model_config: null\`），TorchSpec 会自动根据目标模型的结构生成一个合理的默认配置。
    `,
  },
  {
    id: "speculative-decoding",
    title: "投机解码 (Speculative Decoding)",
    category: "核心概念",
    content: `
投机解码是一种推理加速技术。它的核心思想是：

1. **草稿阶段**：用轻量的草稿模型一次性"猜测"生成多个候选词元（token）
2. **验证阶段**：由目标模型一次性验证这些候选词元是否正确
3. **接受/拒绝**：正确的词元被接受，错误的词元被拒绝并从拒绝点重新生成

这种方式将目标模型"逐个生成 token"的串行过程，变成了"一次验证多个 token"的并行过程，从而显著提升了推理吞吐量。

在 TorchSpec 的"带解码训练"模式（\`train_with_decode: true\`）中，推理引擎会使用投机解码来生成训练数据，使训练数据的分布更接近实际推理时的场景。
    `,
  },
  {
    id: "async-architecture",
    title: "异步分离式架构",
    category: "核心概念",
    content: `
TorchSpec 将推理和训练两个过程完全解耦，分别运行在不同的 GPU 上：

**推理侧**（InferenceEngine）：
- 运行目标模型，对 prompt 进行推理
- 捕获隐状态和 logits，存入 Mooncake Store
- 由 \`AsyncInferenceManager\` 管理多个推理引擎的任务分发

**训练侧**（TrainActor）：
- 从 Mooncake Store 拉取训练数据
- 使用 FSDP 进行草稿模型的分布式训练
- 支持梯度累积和混合精度训练

**协调层**（AsyncTrainingController）：
- 管理数据集的加载和分发
- 协调推理和训练之间的数据流
- 维护一个样本池（sample pool），确保训练数据的充足供应

这种架构的优势在于推理和训练可以完全并行，互不阻塞，最大化 GPU 利用率。
    `,
  },

  // ── 配置指南 ──
  {
    id: "config-structure",
    title: "配置文件结构",
    category: "配置指南",
    content: `
TorchSpec 的所有训练行为都由 YAML 配置文件控制。配置文件采用分层结构，主要模块如下：

| 模块 | 主要作用 |
|---|---|
| \`model\` | 定义目标模型和草稿模型的路径与属性 |
| \`dataset\` | 指定训练数据集的路径、格式和预处理方式 |
| \`training\` | 控制训练过程的核心参数，如批次大小、学习率、训练步数等 |
| \`inference\` | 配置推理引擎的行为，如使用的 GPU 数量、推理批次大小等 |
| \`sglang\` | SGLang 推理后端的专属配置，如张量并行（TP）大小 |
| \`mooncake\` | 配置 Mooncake 跨节点张量传输，如主节点地址、传输协议 |
| \`decode\` | 启用"带解码训练"模式时，配置投机解码的参数 |
| \`output_dir\` | 指定模型检查点和日志的输出目录 |
    `,
  },
  {
    id: "key-config",
    title: "关键配置项",
    category: "配置指南",
    content: `
以下是你最可能需要修改的关键配置项：

\`\`\`yaml
model:
  # 目标模型路径，可以是本地路径或 Hugging Face Hub 上的模型 ID
  target_model_path: Qwen/Qwen3-8B
  # 草稿模型的配置文件，null 则自动生成
  draft_model_config: null

dataset:
  # 训练数据路径，支持 HF Hub ID 或本地 jsonl/parquet 文件
  train_data_path: ./recipes/local_train.jsonl
  # 对话模板，必须与你的模型匹配
  chat_template: qwen

training:
  batch_size: 4              # 每个训练 GPU 上的批次大小
  global_batch_size: 8       # 全局批次大小
  learning_rate: 1e-4        # 学习率
  num_train_steps: 10000     # 总训练步数
  ttt_length: 7              # 草稿模型一次投机预测的 token 数量
  save_interval: 5000        # 每隔多少步保存检查点

inference:
  inference_num_gpus: 1            # 用于推理的 GPU 总数
  inference_num_gpus_per_engine: 1 # 每个推理引擎使用的 GPU 数

sglang:
  sglang_tp_size: 1          # SGLang 的张量并行大小

output_dir: ./outputs/my_experiment
\`\`\`
    `,
  },
  {
    id: "custom-training",
    title: "启动自定义训练",
    category: "配置指南",
    content: `
你可以通过 \`--config\` 参数指定配置文件，并通过命令行用点号语法覆盖其中的任意参数：

\`\`\`bash
python3 -m torchspec.train_entry \\
    --config /path/to/your/custom_config.yaml \\
    training.learning_rate=5e-5 \\
    model.target_model_path="meta-llama/Llama-3-8B-Instruct"
\`\`\`

命令行参数会覆盖配置文件中的同名参数。这在调试或快速实验时非常方便——你不需要为每次实验都创建一个新的配置文件。
    `,
  },
  {
    id: "data-format",
    title: "训练数据格式",
    category: "配置指南",
    content: `
TorchSpec 支持两种数据来源：

**本地 JSONL 文件**

每行一个 JSON 对象，包含多轮对话：

\`\`\`json
{
  "id": "sample_001",
  "conversations": [
    {"role": "user", "content": "How do I get started?"},
    {"role": "assistant", "content": "Here is how..."}
  ]
}
\`\`\`

**Hugging Face 数据集**

直接使用 HF Hub 上的数据集 ID：

\`\`\`yaml
dataset:
  train_data_path: HuggingFaceTB/smoltalk
  prompt_key: conversations
  chat_template: qwen
\`\`\`

\`chat_template\` 参数指定对话模板，目前支持 \`qwen\`、\`llama\`、\`gemma\` 等主流模型的模板格式。模板会将多轮对话转换为模型能理解的 token 序列。
    `,
  },

  // ── 训练 Recipes ──
  {
    id: "eagle3-single",
    title: "Eagle3 单机训练",
    category: "训练 Recipes",
    content: `
最基础的训练方式，适合在单台多卡机器上快速验证：

\`\`\`bash
cd recipes

# run_train_entry_eagle3.sh <训练GPU数> <推理GPU数>
./run_train_entry_eagle3.sh 1 1    # 1卡训练 + 1卡推理
./run_train_entry_eagle3.sh 2 2    # 2卡训练 + 2卡推理
\`\`\`

对应的配置文件是 \`configs/test_train_entry_eagle3.yaml\`。脚本会自动启动 Ray 集群和 Mooncake master。
    `,
  },
  {
    id: "eagle3-multi-gpu",
    title: "Eagle3 单机多卡 (FSDP)",
    category: "训练 Recipes",
    content: `
使用 FSDP（Fully Sharded Data Parallel）在多张 GPU 上分布式训练草稿模型：

\`\`\`bash
cd recipes

# 使用 4 张 GPU 训练 + 4 张 GPU 推理
./run_train_entry_eagle3_multi.sh
\`\`\`

对应配置 \`configs/test_train_entry_eagle3_multi.yaml\`，关键参数：

\`\`\`yaml
training:
  training_num_gpus_per_node: 4  # 每个节点用于训练的 GPU 数
  batch_size: 2                   # 每个 GPU 上的批次大小
  global_batch_size: 8            # 全局批次大小 = batch_size × GPU数

inference:
  inference_num_gpus: 4           # 推理 GPU 总数
  inference_num_gpus_per_engine: 1
\`\`\`
    `,
  },
  {
    id: "sgl-online",
    title: "SGLang Online 训练",
    category: "训练 Recipes",
    content: `
使用 SGLang 推理后端进行在线训练。SGLang 提供了更高效的推理引擎，支持投机解码和 RadixAttention：

\`\`\`bash
cd recipes
./run_train_entry_sgl_online_qwen3_8B.sh
\`\`\`

在"带解码训练"模式下（\`train_with_decode: true\`），推理引擎会使用投机解码生成完整的输出序列，使训练数据更接近实际推理场景。关键的 decode 配置：

\`\`\`yaml
decode:
  max_new_tokens: 512
  temperature: 1.0
  speculative_algorithm: EAGLE3
  speculative_num_steps: 5
  speculative_eagle_topk: 1
  speculative_num_draft_tokens: 6
  weight_sync_enabled: true      # 定期同步训练权重到推理引擎
  weight_sync_interval: 50       # 每 50 步同步一次
\`\`\`
    `,
  },
  {
    id: "multi-node",
    title: "多机多卡训练",
    category: "训练 Recipes",
    content: `
TorchSpec 原生支持多机训练。你需要：

1. 在主节点启动 Ray Head：

\`\`\`bash
ray start --head --port=6379
\`\`\`

2. 在其他节点加入集群：

\`\`\`bash
ray start --address=<head-node-ip>:6379
\`\`\`

3. 确保所有节点之间的网络（特别是 RDMA）是通畅的

4. 在配置文件中设置 Mooncake：

\`\`\`yaml
mooncake:
  master_addr: <head-node-ip>:50051
  protocol: rdma    # 或 tcp
  global_segment_size: 16GB
  local_buffer_size: 32GB
\`\`\`

5. 使用多节点启动脚本：

\`\`\`bash
cd recipes
./run_train_entry_sgl_multi_node.sh
\`\`\`
    `,
  },

  // ── 常用操作 ──
  {
    id: "wandb",
    title: "训练监控 (Wandb)",
    category: "常用操作",
    content: `
TorchSpec 内置了对 Weights & Biases 的支持。通过环境变量启用：

\`\`\`bash
WANDB_ENABLED=1 \\
WANDB_PROJECT=my_torchspec_runs \\
./recipes/run_train_entry_eagle3.sh 1 1
\`\`\`

支持的环境变量：

| 环境变量 | 描述 |
|---|---|
| \`WANDB_ENABLED\` | 设置为 \`1\` 启用 wandb |
| \`WANDB_PROJECT\` | wandb 项目名称 |
| \`WANDB_GROUP\` | 对多次运行进行分组 |
| \`WANDB_TEAM\` | wandb 团队/实体名称（可选） |
| \`WANDB_API_KEY\` | wandb API 密钥 |

TorchSpec 同时支持 TensorBoard 作为替代的监控方案。
    `,
  },
  {
    id: "checkpoint-convert",
    title: "检查点转换",
    category: "常用操作",
    content: `
训练产出的模型检查点是 FSDP 格式。使用 \`tools/convert_to_hf.py\` 将其转换为标准的 Hugging Face 格式：

\`\`\`bash
python tools/convert_to_hf.py \\
    --input-dir ./outputs/my_experiment/iter_0010000/ \\
    --output-dir ./outputs/my_experiment/hf_checkpoint/
\`\`\`

转换后的检查点可以直接用 \`transformers\` 库加载，也可以上传到 Hugging Face Hub 进行分享。
    `,
  },
  {
    id: "kill-processes",
    title: "终止所有进程",
    category: "常用操作",
    content: `
TorchSpec 会启动多个后台服务（Ray actors、Mooncake master 等）。使用清理脚本确保所有相关进程被彻底终止：

\`\`\`bash
./recipes/kill_all_torchspec.sh
\`\`\`

该脚本会依次终止 Ray 集群、Mooncake master 和所有相关的 Python 进程。在重新启动训练之前，建议先运行此脚本确保环境干净。
    `,
  },
  {
    id: "logging",
    title: "日志与调试",
    category: "常用操作",
    content: `
通过环境变量 \`TORCHSPEC_LOG_LEVEL\` 控制日志级别：

\`\`\`bash
# 可选值：DEBUG, INFO, WARNING, ERROR
TORCHSPEC_LOG_LEVEL=INFO ./recipes/run_train_entry_eagle3.sh 1 1
\`\`\`

日志格式为：

\`\`\`
[2025-01-15 10:30:00] train_actor.py:123 INFO Training step 100, loss=2.345
\`\`\`

在多机训练中，日志会包含节点 IP 和 Rank 信息，方便定位问题。
    `,
  },

  // ── 架构详解 ──
  {
    id: "architecture-overview",
    title: "系统架构概览",
    category: "架构详解",
    content: `
TorchSpec 的异步训练数据流如下：

\`\`\`
┌──────────────────────────────────────────────────────────────┐
│                    TorchSpec 训练流程                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  数据集 ──► AsyncTrainingController ◄──┐                    │
│  (Prompts)      (元数据协调)           │                    │
│                  │                      │ (结果元数据)       │
│                  ▼                      │                    │
│          AsyncInferenceManager          │                    │
│          (推理任务分发)                 │                    │
│                  │                      │                    │
│    ┌─────────────┴─────────────┐        │                    │
│    ▼                           ▼        │                    │
│  InferenceEngine 1  ...  InferenceEngine N                   │
│  (目标模型推理)          (目标模型推理)                      │
│    │                           │                             │
│    └─────────┬─────────────────┘                             │
│              ▼                                               │
│        Mooncake Store  (张量存储, RDMA/TCP)                  │
│              ▲                                               │
│    ┌─────────┴─────────────────┐                             │
│    ▼                           ▼                             │
│  TrainActor 1    ...     TrainActor M                        │
│  (草稿模型训练)          (草稿模型训练)                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
\`\`\`

1. **数据加载**：AsyncTrainingController 从数据集中加载 prompts
2. **推理请求**：AsyncInferenceManager 将 prompts 分发给空闲的 InferenceEngine
3. **目标模型推理**：InferenceEngine 执行推理，将隐状态和 logits 存入 Mooncake Store
4. **元数据返回**：InferenceEngine 将数据键返回给 Controller
5. **训练批次分发**：Controller 收集足够的推理结果后，将数据键分发给 TrainActor
6. **草稿模型训练**：TrainActor 从 Mooncake Store 拉取数据，执行训练步骤
    `,
  },
  {
    id: "gpu-allocation",
    title: "GPU 分配策略",
    category: "架构详解",
    content: `
TorchSpec 将 GPU 分为推理组和训练组，两组互不重叠。以 8 卡机器为例：

| 配置 | 推理 GPU | 训练 GPU | 适用场景 |
|---|---|---|---|
| 4+4 | GPU 0-3 | GPU 4-7 | 平衡配置，推荐 |
| 2+6 | GPU 0-1 | GPU 2-7 | 草稿模型较大时 |
| 6+2 | GPU 0-5 | GPU 6-7 | 目标模型较大时 |

推理侧的 GPU 还可以进一步配置张量并行（TP），例如 \`inference_num_gpus_per_engine: 2\` 表示每个推理引擎使用 2 张 GPU。

训练侧使用 FSDP 自动将草稿模型分片到所有训练 GPU 上。
    `,
  },
];

export function getCategories(): DocCategory[] {
  const categoryMap = new Map<string, DocSection[]>();
  const categoryOrder: string[] = [];

  for (const section of sections) {
    if (!categoryMap.has(section.category)) {
      categoryMap.set(section.category, []);
      categoryOrder.push(section.category);
    }
    categoryMap.get(section.category)!.push(section);
  }

  return categoryOrder.map((name) => ({
    name,
    sections: categoryMap.get(name)!,
  }));
}

export function getAllSections(): DocSection[] {
  return sections;
}

export function getSectionById(id: string): DocSection | undefined {
  return sections.find((s) => s.id === id);
}

export function searchSections(query: string): DocSection[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  return sections.filter(
    (s) =>
      s.title.toLowerCase().includes(lower) ||
      s.content.toLowerCase().includes(lower) ||
      s.category.toLowerCase().includes(lower)
  );
}
