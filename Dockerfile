# ベースイメージ
FROM node:18-alpine

# 作業ディレクトリ
WORKDIR /app

# 依存関係をコピーしてインストール
COPY package.json package-lock.json ./
RUN npm ci

# ソースをコピー
COPY . .

# ポート設定
EXPOSE 3000

# 開発モードで起動
CMD ["npm", "run", "dev"]