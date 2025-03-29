# 元の公式イメージをベースに
FROM mcr.microsoft.com/devcontainers/typescript-node:latest

# Puppeteer / Chromium に必要なライブラリを追加
RUN apt-get update && apt-get install -y \
  locales \
  sed \
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
  fonts-ipafont \
  fonts-ipaexfont \
  fonts-noto-cjk \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# 日本語ロケールを追加
RUN sed -i 's/# ja_JP.UTF-8 UTF-8/ja_JP.UTF-8 UTF-8/g' /etc/locale.gen

# 日本語ロケールを生成
RUN locale-gen

# 日本語ロケールを環境変数に設定
ENV LANG ja_JP.UTF-8
ENV LANGUAGE ja_JP:ja
ENV LC_ALL ja_JP.UTF-8