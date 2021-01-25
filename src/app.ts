import {Canvas} from 'canvas'
import GIFEncoder from 'gifencoder'

const parts : number = 3 
const scGap : number = 0.02 / parts 
const delay : number = 20 
const strokeFactor : number = 90 
const backColor : string = "black"
const foreColor : string = "white"

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