# 第一阶段：构建React应用
FROM alibaba-cloud-linux-3-registry.cn-hangzhou.cr.aliyuncs.com/alinux3/node:20.16 as build

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制所有源代码
COPY . .

# 构建生产版本
RUN npm run build

# 第二阶段：使用Nginx提供静态文件服务
FROM nginx:alpine

# 设置Nginx配置，允许跨域请求
COPY --from=build /app/dist /usr/share/nginx/html

# 直接复制nginx配置（如果文件不存在，构建会失败，但我们知道文件已存在）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]