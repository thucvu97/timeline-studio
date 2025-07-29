#!/bin/bash

# Script to download ONNX models for Timeline Studio
# Этот скрипт загружает необходимые ONNX модели для работы с ML функциями

set -e

MODEL_DIR="src-tauri/models"
YOLO_DIR="$MODEL_DIR/yolo"
FACENET_DIR="$MODEL_DIR/facenet"

echo "📦 Загрузка ML моделей для Timeline Studio..."

# Создаем директории
mkdir -p "$YOLO_DIR"
mkdir -p "$FACENET_DIR"

# YOLO Models
echo "🔍 Загружаем YOLO модели..."

# YOLOv8 объекты - все размеры
echo "📦 YOLOv8 Object Detection Models:"

download_yolo_v8_object() {
    local size=$1
    local file="yolov8${size}.onnx"
    
    if [ ! -f "$YOLO_DIR/$file" ]; then
        echo "  📥 YOLOv8${size} (объекты)..."
        curl -L "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8${size}.onnx" \
             -o "$YOLO_DIR/$file" || {
            echo "  ⚠️  Не удалось загрузить YOLOv8${size}, создаем заглушку"
            touch "$YOLO_DIR/$file"
        }
    fi
}

# Загружаем все размеры YOLOv8 для объектов
download_yolo_v8_object "n"  # nano
download_yolo_v8_object "s"  # small  
download_yolo_v8_object "m"  # medium
download_yolo_v8_object "l"  # large
download_yolo_v8_object "x"  # extra

# YOLOv11 объекты - все размеры (fallback к v8)
echo "📦 YOLOv11 Object Detection Models:"

download_yolo_v11_object() {
    local size=$1
    local file="yolov11${size}.onnx"
    
    if [ ! -f "$YOLO_DIR/$file" ]; then
        echo "  📥 YOLOv11${size} (объекты)..."
        # YOLOv11 может быть недоступна, используем v8 как fallback
        if [ -f "$YOLO_DIR/yolov8${size}.onnx" ]; then
            cp "$YOLO_DIR/yolov8${size}.onnx" "$YOLO_DIR/$file"
            echo "  ⚠️  Используется YOLOv8${size} как fallback для YOLOv11${size}"
        else
            touch "$YOLO_DIR/$file"
            echo "  ⚠️  Создана заглушка для YOLOv11${size}"
        fi
    fi
}

# Загружаем все размеры YOLOv11 для объектов
download_yolo_v11_object "n"  # nano
download_yolo_v11_object "s"  # small
download_yolo_v11_object "m"  # medium 
download_yolo_v11_object "l"  # large
download_yolo_v11_object "x"  # extra

# YOLOv8 Face Detection - все размеры
echo "📦 YOLOv8 Face Detection Models:"

download_yolo_v8_face() {
    local size=$1
    local file="yolov8${size}-face.onnx"
    
    if [ ! -f "$YOLO_DIR/$file" ]; then
        echo "  📥 YOLOv8${size}-Face..."
        # Примечание: Реальные модели лиц нужно найти или тренировать
        # Пока используем заглушки - копируем обычные YOLOv8
        if [ -f "$YOLO_DIR/yolov8${size}.onnx" ]; then
            cp "$YOLO_DIR/yolov8${size}.onnx" "$YOLO_DIR/$file"
            echo "  ⚠️  Используется YOLOv8${size} как заглушка для Face"
        else
            touch "$YOLO_DIR/$file"
            echo "  ⚠️  Создана заглушка для YOLOv8${size}-Face"
        fi
    fi
}

# Загружаем все размеры YOLOv8 для лиц
download_yolo_v8_face "n"  # nano
download_yolo_v8_face "s"  # small
download_yolo_v8_face "m"  # medium
download_yolo_v8_face "l"  # large
download_yolo_v8_face "x"  # extra

# YOLOv11 Face Detection - все размеры
echo "📦 YOLOv11 Face Detection Models:"

download_yolo_v11_face() {
    local size=$1
    local file="yolov11${size}-face.onnx"
    
    if [ ! -f "$YOLO_DIR/$file" ]; then
        echo "  📥 YOLOv11${size}-Face..."
        # Используем YOLOv8 Face как fallback
        if [ -f "$YOLO_DIR/yolov8${size}-face.onnx" ]; then
            cp "$YOLO_DIR/yolov8${size}-face.onnx" "$YOLO_DIR/$file"
            echo "  ⚠️  Используется YOLOv8${size}-Face как fallback для YOLOv11${size}-Face"
        else
            touch "$YOLO_DIR/$file"
            echo "  ⚠️  Создана заглушка для YOLOv11${size}-Face"
        fi
    fi
}

# Загружаем все размеры YOLOv11 для лиц
download_yolo_v11_face "n"  # nano
download_yolo_v11_face "s"  # small
download_yolo_v11_face "m"  # medium
download_yolo_v11_face "l"  # large
download_yolo_v11_face "x"  # extra

# FaceNet Models
echo "🧠 Загружаем FaceNet модели..."

# Примечание: Эти модели нужно найти или конвертировать
# Для демонстрации создаем простые заглушки

# FaceNet 512D
if [ ! -f "$FACENET_DIR/facenet-512d.onnx" ]; then
    echo "  📥 FaceNet 512D..."
    # Создаем минимальную ONNX модель-заглушку
    python3 - <<EOF
import onnx
import numpy as np
from onnx import helper, TensorProto, ValueInfoProto

# Создаем простую модель-заглушку для FaceNet
# Входной тензор: [1, 3, 160, 160] (batch, channels, height, width)
input_tensor = helper.make_tensor_value_info(
    'input',
    TensorProto.FLOAT,
    [1, 3, 160, 160]
)

# Выходной тензор: [1, 512] (batch, embedding_dimension)
output_tensor = helper.make_tensor_value_info(
    'output',
    TensorProto.FLOAT,
    [1, 512]
)

# Простая операция GlobalAveragePool + Reshape для создания 512D вектора
gap_node = helper.make_node(
    'GlobalAveragePool',
    inputs=['input'],
    outputs=['gap_output'],
    name='global_avg_pool'
)

reshape_node = helper.make_node(
    'Reshape',
    inputs=['gap_output', 'shape'],
    outputs=['output'],
    name='reshape'
)

# Константа для reshape
shape_tensor = helper.make_tensor(
    'shape',
    TensorProto.INT64,
    [2],
    [1, 512]
)

shape_init = helper.make_tensor_value_info(
    'shape',
    TensorProto.INT64,
    [2]
)

# Создаем граф
graph = helper.make_graph(
    nodes=[gap_node, reshape_node],
    name='FaceNet512D',
    inputs=[input_tensor],
    outputs=[output_tensor],
    initializer=[shape_tensor]
)

# Создаем модель
model = helper.make_model(graph)
model.opset_import[0].version = 13

# Сохраняем
onnx.save(model, '$FACENET_DIR/facenet-512d.onnx')
print("✅ FaceNet 512D model created")
EOF

    if [ $? -ne 0 ]; then
        echo "  ⚠️  Python не найден или ошибка создания модели, создаем пустой файл"
        touch "$FACENET_DIR/facenet-512d.onnx"
    fi
fi

# FaceNet 128D (упрощенная версия)
if [ ! -f "$FACENET_DIR/facenet-128d.onnx" ]; then
    echo "  📥 FaceNet 128D..."
    python3 - <<EOF
import onnx
import numpy as np
from onnx import helper, TensorProto, ValueInfoProto

# Аналогично, но с 128D выходом
input_tensor = helper.make_tensor_value_info(
    'input',
    TensorProto.FLOAT,
    [1, 3, 160, 160]
)

output_tensor = helper.make_tensor_value_info(
    'output',
    TensorProto.FLOAT,
    [1, 128]
)

gap_node = helper.make_node(
    'GlobalAveragePool',
    inputs=['input'],
    outputs=['gap_output'],
    name='global_avg_pool'
)

reshape_node = helper.make_node(
    'Reshape',
    inputs=['gap_output', 'shape'],
    outputs=['output'],
    name='reshape'
)

shape_tensor = helper.make_tensor(
    'shape',
    TensorProto.INT64,
    [2],
    [1, 128]
)

graph = helper.make_graph(
    nodes=[gap_node, reshape_node],
    name='FaceNet128D',
    inputs=[input_tensor],
    outputs=[output_tensor],
    initializer=[shape_tensor]
)

model = helper.make_model(graph)
model.opset_import[0].version = 13

onnx.save(model, '$FACENET_DIR/facenet-128d.onnx')
print("✅ FaceNet 128D model created")
EOF

    if [ $? -ne 0 ]; then
        echo "  ⚠️  Создаем пустой файл для FaceNet 128D"
        touch "$FACENET_DIR/facenet-128d.onnx"
    fi
fi

# ArcFace 512D
if [ ! -f "$FACENET_DIR/arcface-512d.onnx" ]; then
    echo "  📥 ArcFace 512D..."
    # Копируем FaceNet как заглушку
    cp "$FACENET_DIR/facenet-512d.onnx" "$FACENET_DIR/arcface-512d.onnx"
    echo "  ⚠️  Используется FaceNet как заглушка для ArcFace"
fi

echo ""
echo "✅ Загрузка моделей завершена!"
echo ""
echo "📋 Состояние моделей:"
echo "YOLO модели:"
ls -la "$YOLO_DIR"/*.onnx 2>/dev/null || echo "  ❌ YOLO модели не найдены"
echo ""
echo "FaceNet модели:"
ls -la "$FACENET_DIR"/*.onnx 2>/dev/null || echo "  ❌ FaceNet модели не найдены"
echo ""

echo "⚠️  ВАЖНО:"
echo "   Загруженные модели являются заглушками для разработки."
echo "   Для продакшена нужны реальные обученные модели:"
echo "   - YOLOv8/v11 Face Detection models"
echo "   - FaceNet/ArcFace embedding models"
echo ""
echo "📚 Источники реальных моделей:"
echo "   - YOLO Face: https://github.com/deepcam-cn/yolov5-face"
echo "   - FaceNet: https://github.com/onnx/models/tree/main/vision/body_analysis/facenet"
echo "   - ArcFace: https://github.com/onnx/models/tree/main/vision/body_analysis/arcface"