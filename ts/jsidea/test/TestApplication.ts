module jsidea.test {
    export class TestApplication extends jsidea.core.Application {

        constructor() {
            super();
        }

        //@override abstract
        public create(): void {
            this.testGeometryUtils();
        }

        private testGeometryUtils(): void {
            var con = document.getElementById("content");
            var vie = document.getElementById("view");

            var a = document.createElement("div");
            a.id = "a-cont";
            var b = document.createElement("div");
            b.id = "b-cont";
            var bc = document.createElement("div");
            bc.id = "bc-cont";

            var can = document.createElement("canvas");
            can.id = "can";
            can.width = 1024;
            can.height = 1024;
            var ctx = can.getContext("2d");

            a.appendChild(b);
            b.appendChild(bc);
            con.appendChild(a);
            document.body.appendChild(can);
            
            $(document).bind("click",(evt) => {
                ctx.clearRect(0, 0, can.width, can.height);
                this.drawBoundingBox3(can, ctx, con);
                this.drawBoundingBox3(can, ctx, a);
                this.drawBoundingBox3(can, ctx, b);
                this.drawBoundingBox3(can, ctx, bc);
                this.drawBoundingBox3(can, ctx, vie);
//                this.drawBoundingBox3(can, ctx, can);
            });

            var pos = new layout.Position();
            pos.my.x = "-100%";
            pos.my.y = "-50%";
            pos.at.x = 0;
            pos.at.y = 0;
            pos.of = document.body;
            pos.useTransform = true;    
            pos.boxModel = "border-box";        
            
            $(document).bind("mousemove",(evt) => {
                var pt: any = new geom.Point3D(evt.pageX, evt.pageY);
                pos.at.x = pt.x;
                pos.at.y = pt.y;
                pos.apply(bc);
            });
        }

        private drawBoundingBox4(can: HTMLElement, ctx: CanvasRenderingContext2D, e: HTMLElement): void {
            var size = 100;
            var cenX = e.offsetWidth * 0.5;
            var cenY = e.offsetHeight * 0.5;

            var a = new geom.Point3D(cenX, cenY, 0);
            var b = new geom.Point3D(cenX + size, cenY, 0);
            var c = new geom.Point3D(cenX, cenY, size);
            var d = new geom.Point3D(cenX, cenY + size, 0);

            var locToGlo = geom.Transform.extract(e);
            a = locToGlo.localToGlobal(a.x, a.y);
            b = locToGlo.localToGlobal(b.x, b.y);
            c = locToGlo.localToGlobal(c.x, c.y, c.z);
            d = locToGlo.localToGlobal(d.x, d.y);

            var gloToLoc = geom.Transform.extract(can);
            a = gloToLoc.globalToLocal(a.x, a.y);
            b = gloToLoc.globalToLocal(b.x, b.y);
            c = gloToLoc.globalToLocal(c.x, c.y);
            d = gloToLoc.globalToLocal(d.x, d.y);

            ctx.beginPath();

            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);

            ctx.moveTo(a.x, a.y);
            ctx.lineTo(d.x, d.y);

            ctx.setLineDash([]);
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.moveTo(a.x, a.y);
            ctx.lineTo(c.x, c.y);

            ctx.setLineDash([2, 2]);
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        private drawBoundingBox3(can: HTMLElement, ctx: CanvasRenderingContext2D, e: HTMLElement): void {
            var a = new geom.Point3D(0, 0, 0);
            var b = new geom.Point3D(e.offsetWidth, 0, 0);
            var c = new geom.Point3D(e.offsetWidth, e.offsetHeight, 0);
            var d = new geom.Point3D(0, e.offsetHeight, 0);

            var tim = (new Date()).getTime();

            var locToGlo = geom.Transform.extract(e);
            a = locToGlo.localToGlobal(a.x, a.y);
            b = locToGlo.localToGlobal(b.x, b.y);
            c = locToGlo.localToGlobal(c.x, c.y);
            d = locToGlo.localToGlobal(d.x, d.y);

            var gloToLoc = geom.Transform.extract(can);
            a = gloToLoc.globalToLocal(a.x, a.y);
            b = gloToLoc.globalToLocal(b.x, b.y);
            c = gloToLoc.globalToLocal(c.x, c.y);
            d = gloToLoc.globalToLocal(d.x, d.y);
            
            //            orp = geom.Transform.getLocalToGlobal(e, orp);
            var tim2 = (new Date()).getTime();
            console.log("TIME TO CALC 4 POINTS", tim2 - tim);

            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            //            ctx.strokeStyle = "#00FFFF";
            ctx.lineWidth = 2;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.lineTo(c.x, c.y);
            ctx.lineTo(d.x, d.y);
            ctx.lineTo(a.x, a.y);
            //x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean
            //            ctx.moveTo(orp.x + 5, orp.y);
            //            ctx.arc(orp.x, orp.y, 5, 0, 360);
            ctx.stroke();

            //            ctx.fillText("(" + orp.x.toFixed(2) + ", " + orp.y.toFixed(2) + ") ", orp.x + 5, orp.y - 5);
        }

        private getOffestToCrossDoc(f: HTMLElement, aOther: HTMLElement | Window): geom.Point2D {
            var top: number = 0;
            var left: number = 0;
            while (f && f != aOther) {
                left += f.offsetLeft;
                top += f.offsetTop;
                var par = f.parentElement;
                if (par) {
                    f = par;
                }
                else {

                }
            }
            return new geom.Point2D(left, top);
        }

        private testObserver(): void {
            var d = $("<div>A</div>");
            $("body").append(d);
            var o = d[0];
            Object.observe(o, function(a): void {
                console.log(a);
            });
            o.style.width = "200px";
            o.style.height = "200px";
            o.style.backgroundColor = "#FF00FF";
            //ARRGHHH funzt nit
        }

        private testXMLConverter(): void {
            var x = new jsidea.model.conversion.XMLConverter();
        }

        private testEventDispatcher(): void {
            var d = new jsidea.events.EventDispatcher();
            d.bind("click.setup",(e: jsidea.events.IEvent) => console.log(e.eventType));
            d.trigger(".setup");
        }

        public toString(): string {
            return "[" + this.qualifiedClassName() + "]";
        }
    }
}

interface JQuery {
    globalToLocal(x: number, y: number, z?: number): jsidea.geom.IPoint3DValue;
    localToGlobal(x: number, y: number, z?: number): jsidea.geom.IPoint3DValue;
}

(function($) {
    $.fn.globalToLocal = function(x: number, y: number, z: number = 0) {
        return jsidea.geom.Transform.extract(this[0]).globalToLocal(x, y, z);
    };
    $.fn.localToGlobal = function(x: number, y: number, z: number = 0) {
        return jsidea.geom.Transform.extract(this[0]).localToGlobal(x, y, z);
    };
} (jQuery));