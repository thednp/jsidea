namespace jsidea.geom {
    export class Point3D implements IPoint3DValue {

        public static X_AXIS: Point3D = new Point3D(1, 0, 0);
        public static Y_AXIS: Point3D = new Point3D(0, 1, 0);
        public static Z_AXIS: Point3D = new Point3D(0, 0, 1);

        constructor(
            public x: number = 0,
            public y: number = 0,
            public z: number = 0,
            public w: number = 1) {
        }

        public static create(
            x: number = 0,
            y: number = 0,
            z: number = 0,
            w: number = 1): Point3D {
            return new Point3D(x, y, z, w);
        }

        public getData(): number[] {
            return [this.x, this.y, this.z];
        }

        public setData(data: number[], offset: number = 0): Point3D {
            if (data === undefined)
                return;
            this.x = data[0 + offset];
            this.y = data[1 + offset];
            this.z = data[2 + offset];
            this.w = data.length > (3 + offset) ? data[3 + offset] : 1;
        }

        public copyFrom(pt: IPoint3DValue): Point3D {
            this.x = pt.x;
            this.y = pt.y;
            this.z = pt.z;
            this.w = pt.w;
            return this;
        }

        public copyTo(target: IPoint3DValue): Point3D {
            target.x = this.x;
            target.y = this.y;
            target.z = this.z;
            target.w = this.w;
            return this;
        }

        public equals(point: IPoint3DValue): boolean {
            return point.x == this.x && point.y == this.y && point.z == this.z;
        }

        public length(): number {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }

        public normalize(length: number = 1): Point3D {
            var len: number = this.length();
            if (!len)
                return;
            this.scalar(length / len);
        }

        public clamp(length: number): Point3D {
            var len: number = this.length();
            if (!len || len <= length)
                return;
            this.scalar(length / len);
        }

        public scalar(scale: number): Point3D {
            this.x *= scale;
            this.y *= scale;
            this.z *= scale;
            return this;
        }

        public setTo(x: number, y: number, z: number, w: number = 1): Point3D {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            return this;
        }

        public cross(pt: IPoint3DValue): Point3D {
            var x = this.x;
            var y = this.y;
            var z = this.z;
            this.x = y * pt.z - z * pt.y;
            this.y = z * pt.x - x * pt.z;
            this.z = x * pt.y - y * pt.x;
            return this;
        }

        public crossSet(a: IPoint3DValue, b: IPoint3DValue): Point3D {
            var ax = a.x;
            var ay = a.y;
            var az = a.z;
            var bx = b.x;
            var by = b.y;
            var bz = b.z;
            this.x = ay * bz - az * by;
            this.y = az * bx - ax * bz;
            this.z = ax * by - ay * bx;
            return this;
        }

        public mul(pt: IPoint3DValue): Point3D {
            this.x *= pt.x;
            this.y *= pt.y;
            this.z *= pt.z;
            return this;
        }

        public product(factorA: IPoint3DValue, factorB: IPoint3DValue): Point3D {
            this.x = factorA.x * factorB.x;
            this.y = factorA.y * factorB.y;
            this.z = factorA.z * factorB.z;
            return this;
        }

        public div(divisor: IPoint3DValue): Point3D {
            this.x /= divisor.x;
            this.y /= divisor.y;
            this.z /= divisor.z;
            return this;
        }

        public quotient(divident: IPoint3DValue, divisor: IPoint3DValue): Point3D {
            this.x = divident.x / divisor.x;
            this.y = divident.y / divisor.y;
            this.z = divident.z / divisor.z;
            return this;
        }

        public dot(pt: IPoint3DValue): number {
            return this.x * pt.x + this.y * pt.y + this.z * pt.z;
        }

        public add(summand: IPoint3DValue): Point3D {
            this.x += summand.x;
            this.y += summand.y;
            this.z += summand.z;
            return this;
        }
        
        public translate(x: number, y: number, z: number): Point3D {
            this.x += x;
            this.y += y;
            this.z += z;
            return this;
        }

        public sum(summandA: IPoint3DValue, summandB: IPoint3DValue): Point3D {
            this.x = summandA.x + summandB.x;
            this.y = summandA.y + summandB.y;
            this.z = summandA.z + summandB.z;
            return this;
        }

        public sub(subtrahend: IPoint3DValue): Point3D {
            this.x -= subtrahend.x;
            this.y -= subtrahend.y;
            this.z -= subtrahend.z;
            return this;
        }

        public difference(minuend: IPoint3DValue, subtrahend: IPoint3DValue): Point3D {
            this.x = minuend.x - subtrahend.x;
            this.y = minuend.y - subtrahend.y;
            this.z = minuend.z - subtrahend.z;
            return this;
        }

        public clone(): Point3D {
            return new Point3D(this.x, this.y, this.z, this.w);
        }

        public static interpolate(v0: IPoint3DValue, v1: IPoint3DValue, f: number): Point3D {
            return new Point3D(
                v0.x + (v1.x - v0.x) * f,
                v0.y + (v1.y - v0.y) * f,
                v0.z + (v1.z - v0.z) * f);
        }

        //TODO: implement it
        public static polar(angle: IPoint3DValue, length: number, ret: Point3D = new Point3D()): Point3D {
            var angRad = angle.x * math.Number.DEG_TO_RAD;
            ret.x = Math.cos(angRad) * length;
            ret.y = Math.sin(angRad) * length;
            return ret;
        }

        public static distance(v0: IPoint3DValue, v1: IPoint3DValue): number {
            var dx: number = v0.x - v1.x;
            var dy: number = v0.y - v1.y;
            var dz: number = v0.z - v1.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        }

        public static reflect(vector: IPoint3DValue, normal: IPoint3DValue): Point3D {
            var dp: number = vector.x * normal.x + vector.y * normal.y + vector.z * normal.z;
            return new Point3D(vector.x - 2 * dp * normal.x, vector.y - 2 * dp * normal.y, vector.z - 2 * dp * normal.z);
        }
    }
}