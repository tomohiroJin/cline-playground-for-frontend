# 元の公式イメージをベースに
FROM mcr.microsoft.com/devcontainers/typescript-node:latest

# Puppeteer / Chromium に必要なライブラリを追加
RUN apt-get update && apt-get install -y \
  libnss3 \
  libxss1 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libasound2 \
  libx11-xcb1 \
  libdrm2 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libatk1.0-0 \
  libcups2 \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*
