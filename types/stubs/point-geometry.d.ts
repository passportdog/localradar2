declare module '@mapbox/point-geometry' {
  export default class Point {
    x: number;
    y: number;
    constructor(x: number, y: number);
    clone(): Point;
    add(p: Point): Point;
    sub(p: Point): Point;
    mult(n: number): Point;
    div(n: number): Point;
    rotate(angle: number): Point;
    rotateAround(angle: number, p: Point): Point;
    unit(): Point;
    perp(): Point;
    round(): Point;
    mag(): number;
    equals(p: Point): boolean;
    dist(p: Point): number;
    distSqr(p: Point): number;
    angle(): number;
    angleTo(p: Point): number;
    angleWith(p: Point): number;
    angleWithSep(x: number, y: number): number;
    static convert<T>(a: Point | [number, number] | T): Point;
  }
}
