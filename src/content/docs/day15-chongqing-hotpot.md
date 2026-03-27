---
title: "改装日记：边缘算力舱的诞生"
date: "2026.03.10"
category: "路上VLOG"
description: "4块NVIDIA L40 GPU装进一台VAN——从机柜设计到散热方案，记录边缘算力舱从图纸到实物的全过程。"
author: "志鹏"
coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80"
readTime: "5 分钟"
tags: ["改装", "算力", "GPU"]
---

## 散热是最大挑战

车内密闭空间加上深圳三月的气温，GPU满载15分钟温度就逼近阈值。

最终方案：独立进风通道 + 车顶排风扇，形成定向气流，不和乘员舱混用空气。

## 测试结果

完全断网、纯车载供电条件下：
- Llama 3 70B 量化版：离线问答响应 < 2秒
- Whisper 实时翻译：普通话→英语，延迟约1.5秒
- SD XL 图像生成：单张约8秒

## 下一步

等电气系统联调完成后，还要做一轮高温和低温极端环境测试。
