# Dockerfile - исправленный
FROM node:18-alpine

# Устанавливаем необходимые системные зависимости
RUN apk add --no-cache \
    openssl \
    libc6-compat

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости (без запуска postinstall)
RUN npm ci --ignore-scripts

# Копируем Prisma схему
COPY prisma ./prisma/

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем остальные файлы
COPY . .


# Собираем приложение
RUN npm run build

# Очищаем dev зависимости после сборки
RUN npm prune --production

# Открываем порт
EXPOSE 3000

# Запускаем приложение - используем server.js вместо next start
CMD ["node", "server-docker.js"]