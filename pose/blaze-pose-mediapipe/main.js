import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-core';
// Register WebGL backend.
import '@tensorflow/tfjs-backend-webgl';
import '@mediapipe/pose';

const model = poseDetection.SupportedModels.BlazePose;
const detectorConfig = {
  runtime: 'mediapipe',
  enableSegmentation: true,
  solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose'
                // or 'base/node_modules/@mediapipe/pose' in npm.
};
const detector = await poseDetection.createDetector(model, detectorConfig);

const $video = document.getElementById('video');
const $canvas = document.getElementById('canvas');
const ctx = $canvas.getContext('2d');

const stream = await navigator.mediaDevices.getUserMedia({video: {}});
$video.addEventListener('loadedmetadata', () => {
  $video.width = $video.videoWidth;
  $video.height = $video.videoHeight;
  $canvas.width = $video.videoWidth;
  $canvas.height = $video.videoHeight;
});
$video.srcObject = stream;

const updateVideoFrame = async () => {
  const estimationConfig = { enableSmoothing: true, enableSegmentation: true, smoothSegmentation: false};
  /*
    runtime: 'mediapipe' | 'tfjs';
    enableSmoothing?: boolean;
    enableSegmentation?: boolean;
    smoothSegmentation?: boolean;
    modelType?: BlazePoseModelType;
  */
  const poses = await detector.estimatePoses($video, estimationConfig);
  ctx.clearRect(0, 0, $canvas.width, $canvas.height);
  ctx.drawImage($video, 0, 0, $canvas.width, $canvas.height);
  for (const pose of poses) {
    if (pose.segmentation) {
      const segmentationImage = await pose.segmentation.mask.toCanvasImageSource();
      ctx.globalAlpha = 0.7;
      ctx.drawImage(segmentationImage, 0, 0, $canvas.width, $canvas.height);
      ctx.globalAlpha = 1;
    }
    for (const keypoint of pose.keypoints) {
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  $video.requestVideoFrameCallback(updateVideoFrame);
};

$video.requestVideoFrameCallback(updateVideoFrame);