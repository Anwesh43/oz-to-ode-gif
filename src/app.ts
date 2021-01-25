import {Canvas, CanvasRenderingContext2D} from 'canvas'
import GIFEncoder from 'gifencoder'
import {createWriteStream} from 'fs'

const parts : number = 3 
const scGap : number = 0.02 / parts 
const delay : number = 20 
const strokeFactor : number = 90 
const backColor : string = "black"
const foreColor : string = "white"
const w : number = 500 
const h : number = 500 

class State {

    scale : number = 0

    update(cb : Function) {
        this.scale += scGap 
        if (this.scale > 1) {
            this.scale = 0 
            cb()
        }
    }
}

class Loop {
    animated : boolean = false 
    interval : number = 0

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true 
            this.interval = setInterval(cb, 0)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false 
            clearInterval(this.interval)
        }
    }
}

class ScaleUtil {

    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n 
    }

    static sinify(scale : number) : number {
        return Math.sin(scale * Math.PI)
    }
}

class DrawingUtil {

    static drawLine(
        context : CanvasRenderingContext2D,
        x1 : number,
        y1 : number,
        x2 : number,
        y2 : number
    ) {
        context.beginPath()
        context.moveTo(x1, y1)
        context.lineTo(x2, y2)
        context.stroke()
    }

    static drawDot(
        context : CanvasRenderingContext2D, 
        x : number, 
        y : number, 
        r : number
    ) {
        context.beginPath()
        context.arc(x, y, r, 0, 2 * Math.PI)
        context.fill()
    }

    static drawOText(
        context : CanvasRenderingContext2D,
        scale : number
    ) {
        const sf : number = ScaleUtil.sinify(scale)
        const sf1 : number = ScaleUtil.divideScale(sf, 0, parts)
        const sf2 : number = ScaleUtil.divideScale(sf, 1, parts)
        const sf3 : number = ScaleUtil.divideScale(sf, 2, parts)
        const sf4 : number = ScaleUtil.divideScale(sf, 2, parts)
        const text : string = "O"
        const size : number = Math.min(w, h) / 3
        context.font = context.font.replace(/\d{2}/, `${size}`)
        const tw : number = context.measureText(text).width
        context.fillStyle = foreColor 
        context.strokeStyle = foreColor  
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / strokeFactor 
        context.save()
        context.translate(w / 2 - tw / 2, h / 2 - size / 4)
        context.fillText(text, 0, 0)
        for (var j =0 ; j < 2; j++) {
            context.save()
            context.scale(1 - 2 * j, 1)
            DrawingUtil.drawDot(
                context, 
                -tw / 3 + sf1 * (tw / 3), 
                -size * 0.7 + size * 0.7 * sf2 - size * 0.7 * (1 - 2 * j) * sf3,
                size / 9 
            )
            context.restore()
        }
        context.restore()
    }
}

class OzToOd {

    state : State = new State()

    draw(context : CanvasRenderingContext2D, cb : Function) {
        DrawingUtil.drawOText(context, this.state.scale)
        cb(context)
    }

    update(cb : Function) {
        this.state.update(cb)
    }
}

class Renderer {

    gifencoder : GIFEncoder
    canvas : Canvas
    context : CanvasRenderingContext2D
    loop : Loop = new Loop()
    oto : OzToOd = new OzToOd()

    constructor() {
        this.gifencoder = new GIFEncoder(w, h)
        this.canvas = new Canvas(w, h)
        this.context = this.canvas.getContext('2d')
        this.gifencoder.setDelay(delay)
        this.gifencoder.setQuality(100)
        this.gifencoder.setRepeat(0)
    }

    render(fileName : string) {
        this.gifencoder.createReadStream().pipe(createWriteStream(fileName))
        this.gifencoder.start()
        this.loop.start(() => {
            this.oto.draw(this.context, (context : CanvasRenderingContext2D) => {
                this.gifencoder.addFrame(context)
            })
            this.oto.update(() => {
                this.loop.stop()
                this.gifencoder.finish()
            })
        })
    }
}