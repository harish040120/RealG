import { InferenceSession, Tensor } from 'onnxruntime-web';

export class ONNXModel {
  private session: InferenceSession | null = null;
  private inputShape: [number, number, number, number] = [1, 3, 640, 640];
  private classes: string[] = ['Person', 'NO-Hardhat', 'NO-Mask', 'NO-Safety Vest', 'Mask'];

  async loadModel(modelPath: string) {
    try {
      this.session = await InferenceSession.create(modelPath);
      console.log('ONNX model loaded successfully');
    } catch (e) {
      console.error('Failed to load ONNX model:', e);
      throw e;
    }
  }

  async detect(imageData: ImageData): Promise<Detection[]> {
    if (!this.session) {
      throw new Error('Model not loaded');
    }

    // Preprocess the image
    const processed = this.preprocess(imageData);
    const inputTensor = new Tensor('float32', processed, this.inputShape);

    // Run inference
    const outputs = await this.session.run({ images: inputTensor });
    const predictions = outputs.output0.data;

    // Post-process results
    return this.postprocess(predictions as Float32Array, imageData.width, imageData.height);
  }

  private preprocess(imageData: ImageData): Float32Array {
    const { width, height, data } = imageData;
    const canvas = document.createElement('canvas');
    canvas.width = this.inputShape[3];
    canvas.height = this.inputShape[2];
    const ctx = canvas.getContext('2d')!;
    
    // Draw and resize image
    ctx.drawImage(
      new ImageData(data, width, height),
      0, 0, width, height,
      0, 0, this.inputShape[3], this.inputShape[2]
    );
    
    // Get pixel data and normalize
    const resizedData = ctx.getImageData(0, 0, this.inputShape[3], this.inputShape[2]).data;
    const float32Data = new Float32Array(this.inputShape[0] * this.inputShape[1] * this.inputShape[2] * this.inputShape[3]);
    
    // Normalize and convert to NCHW format
    for (let i = 0; i < resizedData.length; i += 4) {
      float32Data[i / 4] = resizedData[i] / 255.0;         // R
      float32Data[i / 4 + 1 * this.inputShape[2] * this.inputShape[3]] = resizedData[i + 1] / 255.0; // G
      float32Data[i / 4 + 2 * this.inputShape[2] * this.inputShape[3]] = resizedData[i + 2] / 255.0; // B
    }
    
    return float32Data;
  }

  private postprocess(predictions: Float32Array, originalWidth: number, originalHeight: number): Detection[] {
    const detections: Detection[] = [];
    const scaleX = originalWidth / this.inputShape[3];
    const scaleY = originalHeight / this.inputShape[2];
    
    // Assuming YOLO output format: [batch, num_detections, (x1, y1, x2, y2, conf, class)]
    for (let i = 0; i < predictions.length; i += 6) {
      const [x1, y1, x2, y2, conf, classId] = predictions.slice(i, i + 6);
      
      if (conf > 0.5) { // Confidence threshold
        detections.push({
          class: this.classes[Math.round(classId)],
          confidence: conf,
          bbox: [
            Math.round(x1 * scaleX),
            Math.round(y1 * scaleY),
            Math.round(x2 * scaleX),
            Math.round(y2 * scaleY)
          ]
        });
      }
    }
    
    return detections;
  }
}