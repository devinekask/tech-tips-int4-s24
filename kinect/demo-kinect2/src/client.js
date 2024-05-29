const Kinect2 = require('kinect2');
const kinect = new Kinect2();

const $outputCanvas = document.getElementById('outputCanvas'),
outputCtx = $outputCanvas.getContext('2d'),
outputImageData = outputCtx.createImageData($outputCanvas.width, $outputCanvas.height);

const init = () => {
  startKinect();
  window.addEventListener("beforeunload", beforeUnloadHandler);
};

const beforeUnloadHandler = () => {
  kinect.closeDepthReader();
};

const startKinect = () => {
  if (kinect.open()) {
    kinect.on('depthFrame', (newPixelData) => {
      renderDepthFrame(outputCtx, outputImageData, newPixelData);
    });
    kinect.openDepthReader();
  }
};

const renderDepthFrame = (ctx, canvasImageData, newPixelData) => {
  const pixelArray = canvasImageData.data;
  let depthPixelIndex = 0;
  for (let i = 0; i < canvasImageData.data.length; i+=4) {
    if (newPixelData[depthPixelIndex] === 0 || newPixelData[depthPixelIndex] === 255) {
      pixelArray[i+0] = 255;
      pixelArray[i+1] = 0;
      pixelArray[i+2] = 0;
    } else {
      pixelArray[i+0] = newPixelData[depthPixelIndex];
      pixelArray[i+1] = newPixelData[depthPixelIndex];
      pixelArray[i+2] = newPixelData[depthPixelIndex];
    }
    
    pixelArray[i+3] = 0xff;
    depthPixelIndex++;
  }
  ctx.putImageData(canvasImageData, 0, 0);
};

init();