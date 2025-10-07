#!/bin/bash

# 定义变量
IMAGE_NAME="ghg-accounting"
CONTAINER_NAME="ghg-accounting-container"
PORT_MAPPING="8080:80"

# 输出函数，带颜色
function echo_color() {
  local color=$1
  local message=$2
  
  case $color in
    "green")
      echo -e "\033[0;32m$message\033[0m"
      ;;
    "red")
      echo -e "\033[0;31m$message\033[0m"
      ;;
    "yellow")
      echo -e "\033[0;33m$message\033[0m"
      ;;
    *)
      echo "$message"
      ;;
  esac
}

# 检查Docker是否运行
function check_docker() {
  echo_color "yellow" "检查Docker服务状态..."
  if ! docker info > /dev/null 2>&1; then
    echo_color "red" "错误: Docker服务未运行或您没有权限访问Docker守护进程"
    echo_color "red" "请确保Docker已安装并正在运行，并且您有适当的权限"
    exit 1
  fi
  echo_color "green" "Docker服务运行正常"
}

# 停止并移除容器
function stop_and_remove_container() {
  echo_color "yellow" "检查并停止现有容器..."
  if docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo_color "yellow" "停止容器 $CONTAINER_NAME..."
    docker stop "$CONTAINER_NAME" > /dev/null 2>&1
    echo_color "yellow" "移除容器 $CONTAINER_NAME..."
    docker rm "$CONTAINER_NAME" > /dev/null 2>&1
    echo_color "green" "容器已成功停止并移除"
  else
    echo_color "green" "容器 $CONTAINER_NAME 不存在，跳过停止和移除步骤"
  fi
}

# 删除旧镜像（如果用户选择）
function remove_old_image() {
  if [ "$1" = "true" ]; then
    echo_color "yellow" "检查并删除现有镜像..."
    if docker images | grep -q "$IMAGE_NAME"; then
      echo_color "yellow" "删除镜像 $IMAGE_NAME..."
      docker rmi "$IMAGE_NAME" > /dev/null 2>&1
      echo_color "green" "镜像已成功删除"
    else
      echo_color "green" "镜像 $IMAGE_NAME 不存在，跳过删除步骤"
    fi
  else
    echo_color "green" "跳过删除旧镜像步骤"
  fi
}

# 构建新镜像
function build_image() {
  echo_color "yellow" "开始构建Docker镜像..."
  if docker build -t "$IMAGE_NAME" .; then
    echo_color "green" "镜像构建成功"
  else
    echo_color "red" "镜像构建失败"
    exit 1
  fi
}

# 运行新容器
function run_container() {
  echo_color "yellow" "启动新容器..."
  if docker run -d --name "$CONTAINER_NAME" -p "$PORT_MAPPING" "$IMAGE_NAME"; then
    echo_color "green" "容器启动成功"
    echo_color "green" "应用可通过 http://localhost:${PORT_MAPPING%%:*} 访问"
  else
    echo_color "red" "容器启动失败"
    exit 1
  fi
}

# 显示部署完成信息
function show_completion_info() {
  echo_color "green" "========================================"
  echo_color "green" "Docker部署流程完成"
  echo_color "green" "镜像名称: $IMAGE_NAME"
  echo_color "green" "容器名称: $CONTAINER_NAME"
  echo_color "green" "访问地址: http://localhost:${PORT_MAPPING%%:*}"
  echo_color "green" "========================================"
}

# 主函数
function main() {
  # 处理参数，决定是否删除旧镜像
  REMOVE_OLD_IMAGE=false
  if [ "$1" = "--remove-image" ] || [ "$1" = "-r" ]; then
    REMOVE_OLD_IMAGE=true
  fi
  
  echo_color "yellow" "开始Docker部署流程..."
  
  check_docker
  stop_and_remove_container
  remove_old_image "$REMOVE_OLD_IMAGE"
  build_image
  run_container
  show_completion_info
}

# 执行主函数
main "$@"