/** @type {HTMLCanvasElement} */
var canvas = document.getElementById("main")
canvas.style.backgroundColor = "rgb(0,0,255)"
/** @type {CanvasRenderingContext2D} */
var ctx = canvas.getContext("2d")

function drawPt(x, y, sz = 1, drawclr = "rgb(255,255,255)") {
    ctx.beginPath()
    ctx.fillStyle = drawclr
    ctx.fillRect(x, y, sz, sz)
    ctx.closePath()
}

function drawPts(pts, sz, drawclr = "rgb(255,255,255)") {
    for (let pt of pts) {
        drawPt(pt.x, pt.y, sz, drawclr)
    }
}

function drawLine(startPos, endPos, width = 1, drawclr = "rgb(255,255,255)") {
    ctx.beginPath()
    ctx.strokeStyle = drawclr
    ctx.lineWidth = width
    ctx.moveTo(startPos.x, startPos.y)
    ctx.lineTo(endPos.x, endPos.y)
    ctx.stroke()
    ctx.closePath()
}

function drawLines(lines, width = 1, drawclr = "rgb(255,255,255)") {
    for (let line of lines) {
        drawLine(line.start, line.end, width, drawclr);
    }
}


function rotatePt(x, y, rotation, aroundPt) {
    rad = rotation * Math.PI / 180
    x = x - aroundPt.x
    y = y - aroundPt.y
    x2 = (x * Math.cos(rad)) - (y * Math.sin(rad))
    y2 = (x * Math.sin(rad)) + (y * Math.cos(rad))
    return new Vector(x2 + aroundPt.x, y2 + aroundPt.y)
}

function rotatePts(pts, rotation, aroundPt) {
    let newpts = []
    for (let pt of pts) {
        newpts.push(rotatePt(pt.x, pt.y, rotation, aroundPt))
    }
    return newpts
}

class Vector {
    x = null
    y = null
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    getNormal() {
        let v = new Vector(0, 0)
        v.y = this.x
        v.x = -this.y
        return v
    }
}

class Line {
    start = null
    end = null
    direction = null
    constructor(start, end) {
        this.start = start
        this.end = end
        this.direction = new Vector(this.end.x - this.start.x, this.end.y - this.start.y)
    }
}


class Projection {
    x = null
    y = null
    w = null
    h = null
    rotation = null
    center = null
    constructor(x, y, w, h, rotation = 0) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.rotation = rotation;
        this.center = new Vector(x + w / 2, y + h / 2)
    }

    getCorners() {
        let unrotatedCorners = Array(new Vector(this.x, this.y), new Vector(this.x + this.w, this.y), new Vector(this.x + this.w, this.y + this.h), new Vector(this.x, this.y + this.h))
        let rotatedCorners = Array(4)
        for (let i = 0; i < 4; i++) {
            rotatedCorners[i] = rotatePt(unrotatedCorners[i].x, unrotatedCorners[i].y, this.rotation, this.center)
        }
        return rotatedCorners
    }

    getLines() {
        let lines = Array(4)
        let corners = this.getCorners()
        for (let i = 0; i < 4; i++) {
            let next = i + 1;
            if (next == 4) next = 0
            lines[i] = new Line(corners[i], corners[next]);
        }
        return lines
    }

    draw() {
        drawLines(this.getLines())
    }

    /** @param {Projection} */
    checkCollision(shp2, doCheckOtherShape = true) {
        let shp1Proj = new Projection(this.x, this.y, this.w, this.h, 0)
        let shp2Proj = null
        if (this.rotation != 0) {
            let shp2Center = new Vector(shp2.x + shp2.w / 2, shp2.y + shp2.h / 2)
            let newPos = rotatePt(shp2Center.x, shp2Center.y, - this.rotation, this.center)
            newPos.x = newPos.x - (shp2.w / 2)
            newPos.y = newPos.y - (shp2.h / 2)

            shp2Proj = new Projection(newPos.x, newPos.y, shp2.w, shp2.h, shp2.rotation - this.rotation)
        }

        else shp2Proj = new Projection(shp2.x, shp2.y, shp2.w, shp2.h, shp2.rotation)

        let sides = shp1Proj.getLines()
        let shp1Corners = shp1Proj.getCorners()
        let shp2Corners = shp2Proj.getCorners()
        let axis = "y"

        for (let edge of sides) {

            let biggestS2Pt = -Infinity
            let smallestS2Pt = Infinity
            let biggestS1Pt = -Infinity
            let smallestS1Pt = Infinity


            //put corners of shp1 on a line on an axis
            //get the biggest and smallest corners
            for (let pt of shp1Corners) {
                let projection = axis === 'x' ? pt.x : pt.y;
                biggestS1Pt = Math.max(biggestS1Pt, projection);
                smallestS1Pt = Math.min(smallestS1Pt, projection);
            }


            //repeat for shape 2
            for (let pt of shp2Corners) {
                let projection = axis === 'x' ? pt.x : pt.y;
                biggestS2Pt = Math.max(biggestS2Pt, projection);
                smallestS2Pt = Math.min(smallestS2Pt, projection);
            }

            if (smallestS1Pt > biggestS2Pt || smallestS2Pt > biggestS1Pt) {
                return false; // No overlap, so no collision
            }

            axis = axis === "x" ? "y" : "x"

        }


        if (doCheckOtherShape) return shp2.checkCollision(this, false)
        return true
    }
}


//like projection but can be rendered to the screen
class Square extends Projection {
    constructor(x, y, w, h, rotation = 0, color = "rgb(0,0,0)") {
        super(x, y, w, h, rotation)
        ctx.beginPath()
        ctx.save()
        ctx.translate(this.center.x, this.center.y)
        ctx.rotate(rotation * Math.PI / 180)
        ctx.translate(-this.center.x, -this.center.y);
        ctx.fillStyle = color
        ctx.fillRect(x, y, w, h)
        ctx.restore()
        ctx.closePath()
    }
}

s1 = new Square(0, 0, 100, 1200, 45, "rgb(255,0,0)")
s2 = new Square(190, 250, 50, 45, 90)
console.log(s2.checkCollision(s1))


