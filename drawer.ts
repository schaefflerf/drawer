
interface Shape {
    readonly id: number;
    draw(ctx: CanvasRenderingContext2D);
}

interface ShapeManager {
    addShape(shape: Shape, redraw?: boolean): this;
    removeShape(shape: Shape, redraw?: boolean): this;
    removeShapeWithId(id: number, redraw?: boolean): this;
}

interface ShapeFactory {
    label: string;
    handleMouseDown(x: number, y: number);
    handleMouseUp(x: number, y: number);
    handleMouseMove(x: number, y: number);
}

class Point2D {
    constructor(readonly x: number, readonly y: number) {}
}
class AbstractShape {
    private static counter: number = 0;
    readonly id: number;
    constructor() {
        this.id = AbstractShape.counter++;
    }
}
abstract class AbstractFactory<T extends Shape> {
    private from: Point2D;
    private tmpTo: Point2D;
    private tmpShape: T;

    constructor(readonly shapeManager: ShapeManager) {}

    abstract createShape(from: Point2D, to: Point2D): T;

    handleMouseDown(x: number, y: number) {
        this.from = new Point2D(x, y);
    }

    handleMouseUp(x: number, y: number) {
        // remove the temp line, if there was one
        if (this.tmpShape) {
            this.shapeManager.removeShapeWithId(this.tmpShape.id, false);
        }
        this.shapeManager.addShape(this.createShape(this.from, new Point2D(x,y)));
        this.from = undefined;

    }

    handleMouseMove(x: number, y: number) {
        // show temp circle only, if the start point is defined;
        if (!this.from) {
            return;
        }
        if (!this.tmpTo || (this.tmpTo.x !== x || this.tmpTo.y !== y)) {
            this.tmpTo = new Point2D(x,y);
            if (this.tmpShape) {
                // remove the old temp line, if there was one
                this.shapeManager.removeShapeWithId(this.tmpShape.id, false);
            }
            // adds a new temp line
            this.tmpShape = this.createShape(this.from, new Point2D(x,y));
            this.shapeManager.addShape(this.tmpShape);
        }
    }

}
export class Line extends AbstractShape implements Shape {
    constructor(readonly from: Point2D, readonly to: Point2D){
        super();
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(this.to.x, this.to.y);
        ctx.stroke();
    }

}
export class LineFactory extends  AbstractFactory<Line> implements ShapeFactory {

    public label: string = "Linie";

    constructor(shapeManager: ShapeManager){
        super(shapeManager);
    }

    createShape(from: Point2D, to: Point2D): Line {
        return new Line(from, to);
    }

}
class Circle extends AbstractShape implements Shape {
    constructor(readonly center: Point2D, readonly radius: number){
        super();
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.center.x,this.center.y,this.radius,0,2*Math.PI);
        ctx.stroke();
    }
}
export class CircleFactory extends AbstractFactory<Circle> implements ShapeFactory {
    public label: string = "Kreis";

    constructor(shapeManager: ShapeManager){
        super(shapeManager);
    }

    createShape(from: Point2D, to: Point2D): Circle {
        return new Circle(from, CircleFactory.computeRadius(from, to.x, to.y));
    }

    private static computeRadius(from: Point2D, x: number, y: number): number {
        const xDiff = (from.x - x),
            yDiff = (from.y - y);
        return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    }
}
class Rectangle extends AbstractShape implements Shape {
    constructor(readonly from: Point2D, readonly to: Point2D) {
        super();
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.strokeRect(this.from.x, this.from.y,
            this.to.x - this.from.x, this.to.y - this.from.y);
        ctx.stroke();
    }
}
export class RectangleFactory extends AbstractFactory<Rectangle> implements ShapeFactory{
    public label: string = "Rechteck";
    constructor(shapeManager: ShapeManager){
        super(shapeManager);
    }

    createShape(from: Point2D, to: Point2D): Rectangle {
        return new Rectangle(from, to);
    }
}
class Triangle extends AbstractShape implements Shape {

    constructor(readonly p1: Point2D, readonly p2: Point2D, readonly p3: Point2D) {
        super();
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.lineTo(this.p3.x, this.p3.y);
        ctx.lineTo(this.p1.x, this.p1.y);
        ctx.stroke();
    }
}
export class TriangleFactory implements ShapeFactory{
    public label: string = "Dreieck";

    private from: Point2D;
    private tmpTo: Point2D;
    private tmpLine: Line;
    private thirdPoint: Point2D;
    private tmpShape: Triangle;

    constructor(readonly shapeManager: ShapeManager) {}

    handleMouseDown(x: number, y: number) {
        if (this.tmpShape) {
            this.shapeManager.removeShapeWithId(this.tmpShape.id, false);
            this.shapeManager.addShape(
                new Triangle(this.from, this.tmpTo, new Point2D(x,y)));
            this.from = undefined;
            this.tmpTo = undefined;
            this.tmpLine = undefined;
            this.thirdPoint = undefined;
            this.tmpShape = undefined;
        } else {
            this.from = new Point2D(x, y);
        }
    }

    handleMouseUp(x: number, y: number) {
        // remove the temp line, if there was one
        if (this.tmpLine) {
            this.shapeManager.removeShapeWithId(this.tmpLine.id, false);
            this.tmpLine = undefined;
            this.tmpTo = new Point2D(x,y);
            this.thirdPoint = new Point2D(x,y);
            this.tmpShape = new Triangle(this.from, this.tmpTo, this.thirdPoint);
            this.shapeManager.addShape(this.tmpShape);
        }
    }

    handleMouseMove(x: number, y: number) {
        // show temp circle only, if the start point is defined;
        if (!this.from) {
            return;
        }

        if (this.tmpShape) { // second point already defined, update temp triangle
            if (!this.thirdPoint || (this.thirdPoint.x !== x || this.thirdPoint.y !== y)) {
                this.thirdPoint = new Point2D(x,y);
                if (this.tmpShape) {
                    // remove the old temp line, if there was one
                    this.shapeManager.removeShapeWithId(this.tmpShape.id, false);
                }
                // adds a new temp triangle
                this.tmpShape = new Triangle(this.from, this.tmpTo, this.thirdPoint);
                this.shapeManager.addShape(this.tmpShape);
            }
        } else { // no second point fixed, update tmp line
            if (!this.tmpTo || (this.tmpTo.x !== x || this.tmpTo.y !== y)) {
                this.tmpTo = new Point2D(x,y);
                if (this.tmpLine) {
                    // remove the old temp line, if there was one
                    this.shapeManager.removeShapeWithId(this.tmpLine.id, false);
                }
                // adds a new temp line
                this.tmpLine = new Line(this.from, this.tmpTo);
                this.shapeManager.addShape(this.tmpLine);
            }
        }
    }
}

class ToolArea {
    private selectedShape: ShapeFactory = undefined;
    constructor(shapesSelector: ShapeFactory[], menue: Element) {
        const domElms = [];
        shapesSelector.forEach(sl => {
            const domSelElement = document.createElement("li");
            domSelElement.innerText = sl.label;
            menue.appendChild(domSelElement);
            domElms.push(domSelElement);

            domSelElement.addEventListener("click", () => {
                selectFactory.call(this, sl, domSelElement);
            });
        });

        function selectFactory(sl: ShapeFactory, domElm: HTMLElement) {
            // remove class from all elements
            for (let j = 0; j < domElms.length; j++) {
                domElms[j].classList.remove("marked");
            }
            this.selectedShape = sl;
            // add class to the one that is selected currently
            domElm.classList.add("marked");
        }
    }

    getSelectedShape(): ShapeFactory {
        return this.selectedShape;
    }
}

class Canvas{
    private ctx: CanvasRenderingContext2D;
    private shapes: {[p: number]: Shape} = {};
    private width: number;
    private height: number;

    constructor(canvasDomElement: HTMLCanvasElement,
                toolarea: ToolArea) {
        const { width, height} = canvasDomElement.getBoundingClientRect();
        this.width = width;
        this.height = height;
        this.ctx = canvasDomElement.getContext("2d");
        canvasDomElement.addEventListener("mousemove",
            createMouseHandler("handleMouseMove"));
        canvasDomElement.addEventListener("mousedown",
            createMouseHandler("handleMouseDown"));
        canvasDomElement.addEventListener("mouseup",
            createMouseHandler("handleMouseUp"));

        function createMouseHandler(methodName: string) {
            return function (e) {
                e = e || window.event;

                if ('object' === typeof e) {
                    const btnCode = e.button,
                        x = e.pageX - this.offsetLeft,
                        y = e.pageY - this.offsetTop,
                        ss = toolarea.getSelectedShape();
                    // if left mouse button is pressed,
                    // and if a tool is selected, do something
                    if (e.button === 0 && ss) {
                        const m = ss[methodName];
                        // This in the shapeFactory should be the factory itself.
                        m.call(ss, x, y);
                    }
                }
            }
        }
    }

    draw(): this {
        // TODO: it there a better way to reset the canvas?
        this.ctx.beginPath();
        this.ctx.fillStyle = 'lightgrey';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.stroke();

        // draw shapes
        this.ctx.fillStyle = 'black';
        for (let id in this.shapes) {
            this.shapes[id].draw(this.ctx);
        }
        return this;
    }

    private addShape(shape: Shape, redraw: boolean = true): this {
        this.shapes[shape.id] = shape;
        return redraw ? this.draw() : this;
    }

    private removeShape(shape: Shape, redraw: boolean = true): this {
        const id = shape.id;
        delete  this.shapes[id];
        return redraw ? this.draw() : this;
    }

    private removeShapeWithId(id: number, redraw: boolean = true): this {
        delete  this.shapes[id];
        return redraw ? this.draw() : this;
    }

    apply(event: any){ //TODO: if event instanceOf ShapeAddedEvent...this.add...
        if(event instanceof ShapeAddedEvent)
            this.addShape(event.shape, event.redraw)

        console.log(event)
        switch(event.type){
            case "shapeAdded":
                this.addShape(event.shape, event.redraw)
                break;
            case "shapeRemoved":
                this.removeShape(event.shape, event.redraw)
                break;
            case "shapeRemovedWithId":
                this.removeShapeWithId(event.shapeID, event.redraw)
        }
    }
}

class ShapeEvent{
    type: String
}
class ShapeAddedEvent extends ShapeEvent{
    type = "shapeAdded"
    constructor(readonly shape: Shape, readonly redraw: boolean){
        super();
    }
    //applyOnCanvas(c: Canvas){
    //    c.addshape(this.shape this.redraw)
}
class ShapeRemovedEvent extends ShapeEvent{
    type = "shapeRemoved"
    constructor(readonly shape: Shape, readonly redraw: boolean){
        super();
    }
}
class ShapeRemovedWithIdEvent extends ShapeEvent{
    type = "shapeRemovedWithId"
    constructor(readonly shapeId: number, readonly redraw: boolean){
        super();
    }
}

function init() {
    const canvasDomElm = document.getElementById("drawArea") as HTMLCanvasElement;
    const menu = document.getElementsByClassName("tools");

    const eventStream = { //TODO:
         handlers: [],
        registerListener(handler){
             this.handlers.push(handler)
        },
        apply(e: ShapeEvent){
        }
    }

    // Problem here: Factories needs a way to create new Shapes, so they
    // have to call a method of the canvas.
    // The canvas on the other side wants to call the event methods
    // on the toolbar, because the toolbar knows what tool is currently
    // selected.
    // Anyway, we do not want the two to have references on each other
    let canvas: Canvas;
    const sm: ShapeManager = {
        addShape(s, rd) {
            canvas.apply(new ShapeAddedEvent(s, rd));
            return this;
        },
        removeShape(s,rd) {
            canvas.apply(new ShapeRemovedEvent(s, rd));
            return this;
        },
        removeShapeWithId(id, rd) {
            canvas.apply(new ShapeRemovedWithIdEvent(id, rd));
            return this;
        }
    };
    const shapesSelector: ShapeFactory[] = [
        new LineFactory(sm),
        new CircleFactory(sm),
        new RectangleFactory(sm),
        new TriangleFactory(sm)
    ];
    const toolArea = new ToolArea(shapesSelector, menu[0]);
    canvas = new Canvas(canvasDomElm, toolArea);
    canvas.draw();
}
init();