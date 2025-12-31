export class ObjectTracker {
    constructor() {
        this.objects = []; // { id, current: {bbox, score, class...}, target: {...}, missing: 0 }
        this.nextId = 1;
        this.lerpFactor = 0.2;
    }

    /**
     * Update tracker with new detections from AI
     * @param {Array} newDetections - Array of scaled detection objects
     */
    update(newDetections) {
        const matchedIndices = new Set();
        
        // Match new detections to existing objects
        newDetections.forEach(detection => {
            let bestIdx = -1;
            let bestIoU = 0;
            
            this.objects.forEach((obj, idx) => {
                if (matchedIndices.has(idx)) return;
                if (obj.class !== detection.class) return;
                
                const val = this.iou(obj.current.bbox, detection.bbox);
                if (val > bestIoU) {
                    bestIoU = val;
                    bestIdx = idx;
                }
            });
            
            if (bestIoU > 0.3) {
                // Update Target of existing object
                matchedIndices.add(bestIdx);
                this.objects[bestIdx].target = detection;
                this.objects[bestIdx].missing = 0;
                // Update score/distance immediately for accuracy
                this.objects[bestIdx].current.score = detection.score;
                this.objects[bestIdx].current.distance = detection.distance;
            } else {
                // Create New Object
                const newObj = {
                    id: this.nextId++,
                    class: detection.class,
                    current: JSON.parse(JSON.stringify(detection)), // Clone
                    target: detection,
                    missing: 0
                };
                this.objects.push(newObj);
            }
        });
        
        // Mark missing objects
        this.objects.forEach((obj, idx) => {
             if (!matchedIndices.has(idx)) {
                 obj.missing++;
             }
        });
        
        // Remove lost objects (after 5 frames ~80ms)
        this.objects = this.objects.filter(obj => obj.missing < 5);
        
        // console.log(`Tracker: ${this.objects.length} objects`);
    }

    /**
     * Get interpolated object positions for the current frame
     * Call this inside the requestAnimationFrame loop
     */
    getSmoothedObjects() {
        if (this.objects.length === 0) return [];
        
        return this.objects.map(obj => {
            // Lerp BBox ([x,y,w,h])
            obj.current.bbox[0] += (obj.target.bbox[0] - obj.current.bbox[0]) * this.lerpFactor;
            obj.current.bbox[1] += (obj.target.bbox[1] - obj.current.bbox[1]) * this.lerpFactor;
            obj.current.bbox[2] += (obj.target.bbox[2] - obj.current.bbox[2]) * this.lerpFactor;
            obj.current.bbox[3] += (obj.target.bbox[3] - obj.current.bbox[3]) * this.lerpFactor;
            
            // Lerp Distance (Optional, might want instant update? Let's smooth it)
            obj.current.distance += (obj.target.distance - obj.current.distance) * this.lerpFactor;
            
            return obj.current;
        });
    }

    iou(box1, box2) {
        const [x1, y1, w1, h1] = box1;
        const [x2, y2, w2, h2] = box2;
        
        const xA = Math.max(x1, x2);
        const yA = Math.max(y1, y2);
        const xB = Math.min(x1 + w1, x2 + w2);
        const yB = Math.min(y1 + h1, y2 + h2);
        
        const intersection = Math.max(0, xB - xA) * Math.max(0, yB - yA);
        const area1 = w1 * h1;
        const area2 = w2 * h2;
        const union = area1 + area2 - intersection;
        
        return union === 0 ? 0 : intersection / union;
    }
}
