const KinectAzure = require('kinect-azure');
const kinect = new KinectAzure();
const $info = document.getElementById('info');

const $depthCanvas = document.getElementById('depthCanvas'),
depthCtx = $depthCanvas.getContext('2d');
let depthImageData;

const init = () => {
  startKinect();
};

const startKinect = () => {
  if(kinect.open()) {
    
    const depthMode = KinectAzure.K4A_DEPTH_MODE_NFOV_2X2BINNED;
    const convertInCpp = false;
    
    kinect.startCameras({
      depth_mode: depthMode,
      depth_to_greyscale: convertInCpp
    });
    const depthModeRange = kinect.getDepthModeRange(depthMode);
    
    kinect.startListening((data) => {
      $info.textContent = ` ${data.depthImageFrame.width}x${data.depthImageFrame.height}`;
      if (!depthImageData && data.depthImageFrame.width > 0) {
        $depthCanvas.width = data.depthImageFrame.width;
        $depthCanvas.height = data.depthImageFrame.height;
        depthImageData = depthCtx.createImageData($depthCanvas.width, $depthCanvas.height);
      }
      if (depthImageData) {
        if (convertInCpp){
          renderDepthFrameToCanvas(depthCtx, depthImageData, data.depthImageFrame, depthModeRange);
        } else {
          renderDepthFrameAsGreyScale(depthCtx, depthImageData, data.depthImageFrame, depthModeRange);
        }
      }
    });
  }
};

const renderDepthFrameToCanvas = (ctx, canvasImageData, imageFrame, depthModeRange) => {
  canvasImageData.data.set(imageFrame.imageData);
  ctx.putImageData(canvasImageData, 0, 0);
};

const renderDepthFrameAsGreyScale = (ctx, canvasImageData, imageFrame, depthModeRange) => {
  const newPixelData = Buffer.from(imageFrame.imageData);
  const pixelArray = canvasImageData.data;
  let depthPixelIndex = 0;
  for (let i = 0; i < canvasImageData.data.length; i+=4) {
    const depthValue = newPixelData[depthPixelIndex+1] << 8 | newPixelData[depthPixelIndex];
    const normalizedValue = map(depthValue, depthModeRange.min, depthModeRange.max, 255, 0);
    if (depthValue <= depthModeRange.min || depthValue >= depthModeRange.max) {
      pixelArray[i] = 255;
      pixelArray[i+1] = 0;
      pixelArray[i+2] = 0;
      pixelArray[i+3] = 0xff;
    } else {
      pixelArray[i] = normalizedValue;
      pixelArray[i+1] = normalizedValue;
      pixelArray[i+2] = normalizedValue;
      pixelArray[i+3] = 0xff;
    }
    
    depthPixelIndex += 2;
  }
  ctx.putImageData(canvasImageData, 0, 0);
};

const map = (value, inputMin, inputMax, outputMin, outputMax) => {
  return (value - inputMin) * (outputMax - outputMin) / (inputMax - inputMin) + outputMin;
};

/**
* https://gist.github.com/mjackson/5311256
* Converts an HSV color value to RGB. Conversion formula
* adapted from http://en.wikipedia.org/wiki/HSV_color_space.
* Assumes h, s, and v are contained in the set [0, 1] and
* returns r, g, and b in the set [0, 255].
*
* @param   Number  h       The hue
* @param   Number  s       The saturation
* @param   Number  v       The value
* @return  Array           The RGB representation
*/
const hsvToRgb = (h, s, v) => {
  let r, g, b;
  
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  
  return [ r * 255, g * 255, b * 255 ];
}

init();