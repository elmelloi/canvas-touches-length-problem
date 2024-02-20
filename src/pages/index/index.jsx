import { Canvas, Button, View } from "@tarojs/components";
import { useState, useRef } from "react";
import Taro, { useReady } from "@tarojs/taro";

import "./index.less";

export default function Index() {
  const [cameraImage, setCameraImage] = useState("");

  const [canvasInfo, setCanvasInfo] = useState({
    canvasWidth: 0,
    canvasHeight: 0,
    imageX: 0,
    imageY: 0,
  });

  const canvasContextRef = useRef(null);

  const startTouchPositionRef = useRef({ x: 0, y: 0 });

  const imageInfoRef = useRef({ width: 0, height: 0 });

  useReady(async () => {
    const screenInfo = await Taro.getSystemInfo();
    const canvasWidth = screenInfo.screenWidth - 24;
    const canvasHeight = screenInfo.screenHeight;

    setCanvasInfo({
      canvasWidth,
      canvasHeight,
      imageX: 0,
      imageY: 0,
    });
    const ctx = Taro.createCanvasContext("myCanvas");
    canvasContextRef.current = ctx;
  });

  const drawImageOnCanvas = (imagePath, x, y, width, height) => {
    const ctx = canvasContextRef.current;

    ctx.drawImage(imagePath, x, y, width, height);

    ctx.draw(true);
  };

  const handleTakePhoto = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,

        sizeType: ["original", "compressed"],

        sourceType: ["album", "camera"],
      });

      const selectedImage = res.tempFilePaths[0];

      const imageInfo = await Taro.getImageInfo({ src: selectedImage });

      const x = (canvasInfo.canvasWidth - imageInfo.width / 3) / 2;

      const y = (canvasInfo.canvasHeight - imageInfo.height / 3) / 2;

      setCameraImage(selectedImage);

      setCanvasInfo((prevCanvasInfo) => ({
        ...prevCanvasInfo,

        imageX: x,

        imageY: y,

        imageWidth: imageInfo.width / 3,

        imageHeight: imageInfo.height / 3,
      }));

      // 在这里记录图片信息

      imageInfoRef.current = {
        width: imageInfo.width,
        height: imageInfo.height,
      };

      drawImageOnCanvas(
        selectedImage,
        x,
        y,
        imageInfo.width / 3,
        imageInfo.height / 3
      );
    } catch (error) {
      console.error("选择图片失败", error);
    }
  };

  const handleTouchStart = (e) => {
    if (!canvasContextRef.current || !cameraImage) return;

    const touches = e.touches;

    // 获取第一个触摸点的信息

    const firstTouch = touches[0];

    if (touches.length === 2) {
      const [touch1, touch2] = touches;

      startTouchPositionRef.current = [
        { x: touch1.x, y: touch1.y, identifier: touch1.identifier },

        { x: touch2.x, y: touch2.y, identifier: touch2.identifier },
      ];
    } else {
      // 处理单指操作，即拖动

      const { x, y, identifier } = firstTouch;

      startTouchPositionRef.current = { x, y, identifier };
    }
  };

  const handleTouchMove = (e) => {
    if (!canvasContextRef.current || !cameraImage) return;

    const touches = e.touches;

    console.log("touchMove", e.touches);

    if (touches.length === 2) {
      // 处理双指操作

      const [touch1, touch2] = touches;

      const currentTouchPositions = [
        { x: touch1.x, y: touch1.y, identifier: touch1.identifier },

        { x: touch2.x, y: touch2.y, identifier: touch2.identifier },
      ];

      const startDistance = getDistance(
        startTouchPositionRef.current[0],
        startTouchPositionRef.current[1]
      );

      const currentDistance = getDistance(
        currentTouchPositions[0],
        currentTouchPositions[1]
      );

      // console.log('Start Distance:', startDistance, 'Current Distance:', currentDistance);

      const scale = currentDistance / startDistance;

      // console.log('Scale:', scale);

      // 计算新的图片宽度和高度

      const newImageWidth = canvasInfo.imageWidth * scale;

      const newImageHeight = canvasInfo.imageHeight * scale;

      // console.log('New Image Width:', newImageWidth, 'New Image Height:', newImageHeight);

      // 计算新的图片位置

      const newImageX =
        canvasInfo.imageX + (canvasInfo.imageWidth - newImageWidth) / 2;

      const newImageY =
        canvasInfo.imageY + (canvasInfo.imageHeight - newImageHeight) / 2;

      // console.log('New Image X:', newImageX, 'New Image Y:', newImageY);

      setCanvasInfo((prevCanvasInfo) => ({
        ...prevCanvasInfo,

        imageWidth: newImageWidth,

        imageHeight: newImageHeight,

        imageX: newImageX,

        imageY: newImageY,
      }));

      startTouchPositionRef.current = currentTouchPositions;
    } else {
      // 处理单指操作，即拖动

      const { x, y, identifier } = touches[0];

      // 检查是否由双指操作切换到单指操作

      if (startTouchPositionRef.current.length === 2) {
        // 重置 startTouchPositionRef.current 为单指操作的初始位置

        startTouchPositionRef.current = { x, y, identifier };

        return;
      }

      const deltaX = x - startTouchPositionRef.current.x;

      const deltaY = y - startTouchPositionRef.current.y;

      // console.log('Delta X:', deltaX, 'Delta Y:', deltaY);

      // console.log('New Image X:', canvasInfo.imageX + deltaX, 'New Image Y:', canvasInfo.imageY + deltaY);

      // 计算新的图片位置

      const newImageX = canvasInfo.imageX + deltaX;

      const newImageY = canvasInfo.imageY + deltaY;

      // 边界检查，确保不超出 canvas 容器范围

      const maxX = canvasInfo.canvasWidth - canvasInfo.imageWidth;

      const maxY = canvasInfo.canvasHeight - canvasInfo.imageHeight;

      const clampedImageX = Math.max(0, Math.min(newImageX, maxX));

      const clampedImageY = Math.max(0, Math.min(newImageY, maxY));

      setCanvasInfo((prevCanvasInfo) => ({
        ...prevCanvasInfo,

        imageX: clampedImageX,

        imageY: clampedImageY,
      }));

      startTouchPositionRef.current = { x, y, identifier };
    }

    // 使用 Taro.nextTick 确保在下一次渲染时进行绘制

    Taro.nextTick(() => {
      const ctx = canvasContextRef.current;

      // 只清除和绘制用户选择的图片，避免整个画布的闪烁

      ctx.clearRect(0, 0, canvasInfo.canvasWidth, canvasInfo.canvasHeight);

      // 绘制新选择的图片，保持实际尺寸

      ctx.drawImage(
        cameraImage,
        canvasInfo.imageX,
        canvasInfo.imageY,
        canvasInfo.imageWidth,
        canvasInfo.imageHeight
      );

      ctx.draw();
    });
  };

  // 辅助函数，计算两点之间的距离

  const getDistance = (point1, point2) => {
    const dx = point1.x - point2.x;

    const dy = point1.y - point2.y;

    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchEnd = () => {};

  return (
    <View>
      <View className="canvasContainer">
        <Canvas
          canvasId="myCanvas"
          style="width: 100%; height: 100%;"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </View>
      <Button onClick={handleTakePhoto}>选择图片</Button>
    </View>
  );
}
