declare module "gif-encoder-2" {
    import { Writable } from "stream";
    import { CanvasRenderingContext2D } from "canvas";

    export default class GIFEncoder {
        constructor(width: number, height: number, algorithim: string, optimize: boolean);

        start(): void;
        finish(): void;

        setRepeat(repeat: number): void;
        setDelay(delay: number): void;
        setQuality(quality: number): void;
        setThreshold(threshold: number): void;

        addFrame(ctx: CanvasRenderingContext2D): void;

        createReadStream(): Writable;
        
        out: {
            getData(): Buffer;
        };
    }
}
