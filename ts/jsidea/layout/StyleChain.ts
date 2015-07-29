interface Element {
    _node: jsidea.layout.INode;
}
module jsidea.layout {
    export interface INode {
        style: CSSStyleDeclaration;
        element: HTMLElement;
        offsetParent: INode;
        offsetParentRaw: INode;
        parentScroll: INode;
        root: INode;
        isLeaf: boolean;
        child: INode;
        bounds: ClientRect;
        parent: INode;
        relation: INode;
        depth: number;
        offset: geom.Point2D;
        //offset - scroll 
        offsetUnscrolled: geom.Point2D;
        position: geom.Point2D;
        scrollOffset: geom.Point2D;
        offsetLeft: number;
        offsetTop: number;
        clientLeft: number;
        clientTop: number;
        paddingLeft: number;
        paddingTop: number;
        isRelative: boolean;
        isAbsolute: boolean;
        isStatic: boolean;
        isScrollable: boolean;
        isFixed: boolean;
        isFixedChild: boolean;
        isFixedZombie: boolean;
        isBody: boolean;
        isSticked: boolean;
        isStickedChild: boolean;
        isTransformed: boolean;
        isTransformedChild: boolean;
        isPerspectiveChild: boolean;
        perspective: number;
        isPreserved3dOrPerspective: boolean;
        isPreserved3d: boolean;
        isBorderBox: boolean;
        isAccumulatable: boolean;
    }

    export class StyleChain {

        public node: INode = null;

        constructor() {
        }

        public static create(element: HTMLElement): StyleChain {
            var chain = new StyleChain();
            chain.update(element);
            return chain;
        }

        public update(element: HTMLElement): StyleChain {
            if (!element)
                return this.clear();
            this.node = StyleChain.extractStyleChain(element);
        }

        public clear(): StyleChain {
            this.node = null;
            return this;
        }

        public static qualifiedClassName(): string {
            return "jsidea.layout.StyleChain";
        }

        public toString(): string {
            return "[" + StyleChain.qualifiedClassName() + "]";
        }

        private static extractStyleChain(element: HTMLElement): INode {
            //collect computed styles/nodes up to html/root (including html/root)
            var body = element.ownerDocument.body;

            //TODO: what about HTML-element ownerDocument.documentElement
            if (element == body.parentElement)
                return null;
            
            //collect from child to root
            var elements: HTMLElement[] = [];
            while (element && element != body.parentElement) {
                elements.push(element);
                element = element.parentElement;
            }
            
            //run from root to child
            //this should prevent that if the parent element
            //has the webkit-bug and an element changed
            //from static to relative position
            //the offsets of the possible children are wrong
            //and this order prevents it (root to child)
            var nodes: INode[] = [];
            var isTransformedChild = false;
            var isPreserved3dChild = false;
            var isFixedChild = false;
            var isPerspectiveChild = false;
            var l = elements.length;
            for (var i = l - 1; i >= 0; --i) {
                element = elements[i];

                var style = window.getComputedStyle(element);

                //some 3d settings
                var perspective = math.Number.parse(style.perspective, 0);
                //webkit ignores perspective set on scroll elements
                if (system.Caps.isWebkit && style.transform != "none" && style.overflow != "visible" && style.perspective != "none")
                    perspective = 0;

                //create the node-element
                //and set so many values as possible
                var node: INode = {
                    depth: nodes.length,
                    bounds: element.getBoundingClientRect(),
                    element: element,
                    isPreserved3d: style.transformStyle == "preserve-3d",
                    isPreserved3dChild: isPreserved3dChild,
                    isPreserved3dOrPerspective: style.transformStyle == "preserve-3d" || (perspective > 0),
                    perspective: perspective,
                    style: style,
                    root: null,
                    relation: null,
                    parent: null,
                    offsetParent: null,
                    offsetParentRaw: null,
                    parentScroll: null,
                    position: null,
                    child: null,
                    isAccumulatable: true,
                    isPerspectiveChild: isPerspectiveChild,
                    offset: null,
                    offsetUnscrolled: null,
                    scrollOffset: null,
                    isLeaf: element.children.length == 0,
                    isFixedZombie: false,
                    isFixed: style.position == "fixed",
                    isFixedChild: isFixedChild,
                    isRelative: style.position == "relative",
                    isAbsolute: style.position == "absolute",
                    isStatic: style.position == "static",
                    isScrollable: style.overflow != "visible",
                    isBorderBox: style.boxSizing == "border-box",
                    isBody: element == body,
                    isSticked: false,
                    isStickedChild: false,
                    paddingLeft: math.Number.parse(style.paddingLeft, 0),
                    paddingTop: math.Number.parse(style.paddingTop, 0),
                    offsetLeft: element.offsetLeft,
                    offsetTop: element.offsetTop,
                    clientLeft: element.clientLeft,
                    clientTop: element.clientTop,
                    isTransformed: style.transform != "none",
                    isTransformedChild: isTransformedChild
                };
                
                //if the element has transform
                //the following elements are in transformed-context
                if (!isTransformedChild && node.isTransformed)
                    isTransformedChild = true;

                if (!isFixedChild && node.isFixed)
                    isFixedChild = true;

                if (!isPreserved3dChild && node.isPreserved3d)
                    isPreserved3dChild = true;

                if (!isPerspectiveChild && node.perspective > 0)
                    isPerspectiveChild = true;

                element._node = node;
                
                //the lookup should be sorted from root to child
                //NOT vice versa
                nodes.push(node);
            }
            
            //set "isFixed" and "isFixedToAbsolut"
            var rootNode = nodes[0];
            var leafNode = nodes[nodes.length - 1];
            
            //set the references and some properties
            //be careful that the functions
            //do not need the node-properties
            //which are not already set
            //IMPORTANT: the order of the functions is very important for the result
            node = rootNode;
            while (node) {
                //the node references
                node.root = rootNode;
                node.parent = nodes[node.depth - 1];
                node.child = nodes[node.depth + 1];
                node.offsetParentRaw = node.element.offsetParent ? node.element.offsetParent._node : null;
                node.isSticked = this.getIsSticked(node);
                node.isFixedZombie = node.isFixed && !node.isSticked;
                node.isStickedChild = this.getIsStickedChild(node);
                node.offsetParent = this.getOffsetParent(node);
                node.parentScroll = system.Caps.isFirefox ? this.getParentScrollFirefox(node) : this.getParentScroll(node);
                node.isAccumulatable = this.getIsAccumulatable(node);
                node.scrollOffset = this.getScrollOffset(node);
                node.relation = this.getRelation(node);
                node.offset = this.getOffset(node);
                node.offsetUnscrolled = new geom.Point2D(node.offset.x + node.scrollOffset.x, node.offset.y + node.scrollOffset.y);
                node.position = this.getPosition(node);

                //                if(!node.isBody)
                //                    node.position.setTo(node.bounds.left - node.parent.bounds.left, node.bounds.top - node.parent.bounds.top);
                
                node = node.child;
            }

            return leafNode;
        }

        //returns the local position the direct parent
        private static getPosition(node: INode, ret: geom.Point2D = new geom.Point2D()): geom.Point2D {
            if (node.isSticked || node.isBody)
                return ret.setTo(node.offset.x, node.offset.y);
            return ret.setTo(node.offset.x - node.parent.offset.x, node.offset.y - node.parent.offset.y);
        }

        private static getOffsetParent(node: INode): INode {
            //            if (system.Caps.isFirefox)
            //                return node.element.offsetParent ? node.element.offsetParent._node : null;

            //if its forced to have another parent
            if (node.isFixedZombie) {
                while (node = node.parent) {
                    if (node.isBody || node.isSticked)//isSticked is maybe to mouch
                        return node;

                    if (node.isStatic) {
                        if (node.isTransformed || node.isPreserved3dOrPerspective)
                            return node;
                        else
                            continue;
                    }
                    
                    //that is the trick
                    //if the element itself is wrongyl-fixed
                    //than this could not be the offset
                    if ((node.isFixedZombie || !node.isPerspectiveChild) && !node.isTransformed && !node.isPreserved3dOrPerspective) {
                        continue;
                    }

                    //                    if (!node.isPerspectiveChild && !node.isTransformed && !node.isPreserved3dOrPerspective)
                    //                        continue;

                    return node;
                }
                return null;
            }

            if (!node || node.isBody || node.isSticked)
                return null;
            while (node = node.parent) {
                if (!node.isStatic || node.isTransformed || node.isPreserved3dOrPerspective || node.isSticked)//isSticked is maybe to mouch
                {
                    return node;
                }
            }
            return null;
        }

        private static getParentScroll(node: INode): INode {
            //important: if the node is really sticked, then there could not be any scrolling
            if (!node || node.isSticked || !node.parent)
                return null;

            //TODO FIND THE BUG
            //if its forced to have another parent
            if (node.isFixedZombie)
                return node.offsetParent;

            var excludeStaticParent = node.isAbsolute;
            while ((node = node.parent) && node.parent) {
                if (node.isBody || node.isSticked)
                    return node;
                if (excludeStaticParent && (node.isStatic && !node.isTransformed))
                    continue;
                return node;
            }
            return null;
        }

        private static getParentScrollFirefox(node: INode): INode {
            //important: if the node is really sticked, then there could not be any scrolling
            if (!node || node.isSticked || !node.parent)
                return null;

            //TODO FIND THE BUG
            //if its forced to have another parent
            if (node.isFixedZombie)
                return node.offsetParent;

            var excludeStaticParent = node.isAbsolute;
            while ((node = node.parent) && node.parent) {
                if (node.isBody || node.isSticked)
                    return node;
                if (excludeStaticParent && (node.isStatic && !node.isTransformedChild))
                    continue;
                return node;
            }
            return null;
        }

        private static getIsStickedChild(node: INode): boolean {
            while (node) {
                if (node.isSticked)
                    return true;
                node = node.parent;
            }
            return false;
        }

        private static getIsSticked(node: INode): boolean {
            //just skip if the element itself has not fixed
            if (!node.isFixed)
                return false;
            
            //ie does it right
            if (system.Caps.isIE)
                return node.isFixed && !(node.isPerspectiveChild || node.isPreserved3dOrPerspective);

            while (node = node.parent) {
                if (node.isTransformed || node.isPreserved3dOrPerspective)
                    return false;
            }
            return true;
        }

        //if you subtract the scroll from the accumlated/summed offset
        //you get the real offset to window (initial-containing-block)
        private static getScrollOffset(node: INode, ret: geom.Point2D = new geom.Point2D()): geom.Point2D {
            if (!node || !node.parent)
                return ret;
            
            //add scroll value only if reference of the element is the window not the body
            if (node.isStickedChild) {
                if (system.Caps.isWebkit) {
                    ret.x -= node.element.ownerDocument.body.scrollLeft;
                    ret.y -= node.element.ownerDocument.body.scrollTop;

                }
                else {
                    ret.x -= node.element.ownerDocument.documentElement.scrollLeft;
                    ret.y -= node.element.ownerDocument.documentElement.scrollTop;
                }
            }

            //skip body 
            //the body scroll is only needed for element which are fixed to window
            //so this value is added add the getOffset-function
            while ((node = node.parentScroll) && node.element != document.body) {
                ret.x += node.element.scrollLeft;
                ret.y += node.element.scrollTop;
            }
            return ret;
        }

        private static getOffset(node: INode, ret: geom.Point2D = new geom.Point2D()): geom.Point2D {
            ret.x = 0;
            ret.y = 0;

            //the offset of void/null is 0 0
            if (!node)
                return ret;

            ret.x -= node.scrollOffset.x;
            ret.y -= node.scrollOffset.y;
            
            //if is really fixed, then just make it fast
            //wow, and the offsets are correct
            //if the element is really fixed
            if (node.isSticked) {
                this.getCorrectOffset(node, ret);
                return ret;
            }

            var leafNode = node;
            while (node) {
                //for webkit (if there is a wrong offserParent set,
                //then the offsets are also wrong... arghhh)
                //correct them here
                this.getCorrectOffset(node, ret);
                if ((system.Caps.isWebkit || system.Caps.isIE) && !node.offsetParentRaw)
                    break;
                node = node.offsetParent;
            }
            return ret;
        }

        private static getIsAccumulatable(node: INode): boolean {
            //in any case, if an element has only 2d-transforms or its the document-root item
            //the transform can be accumulated to the parent transform
            if (node.isBody || node.style.transform.indexOf("matrix3d") < 0)
                return true;

            //tricky stuff: only firefox does reflect/compute the "correct" transformStyle value.
            //Firefox does NOT reflect the "grouping"-overrides and this is how its concepted.
            //But what about the "opacity"-property. Opacity does not override the preserve-3d (not always, webkit does under some conditions).
            //http://dev.w3.org/csswg/css-transforms/#grouping-property-values
            if (!node.parent.isPreserved3d || node.parent.isScrollable)
                return false;

            return true;
        }

        private static getRelation(node: INode): INode {
            if (!node.parent || node.isSticked)
                return null;
            while (node = node.parent) {
                if (node.isPreserved3d || node.isTransformed) {
                    return node;
                }
            }
            return null;
        }

        private static getCorrectOffset(node: INode, ret: geom.Point2D = new geom.Point2D()): geom.Point2D {
            if (!node)
                return ret;

            ret.x += node.offsetLeft;
            ret.y += node.offsetTop;

            if (system.Caps.isWebkit) {
                this.getCorrectOffsetWebkit(node, ret);
            } else if (system.Caps.isFirefox) {
                this.getCorrectOffsetFirefox(node, ret);
            } else if (system.Caps.isIE) {
                this.getCorrectOffsetIE(node, ret);
            }
            return ret;
        }

        private static getCorrectOffsetIE(node: INode, ret: geom.Point2D = new geom.Point2D()): geom.Point2D {
            if (!node || !node.offsetParent || node.isBody)
                return ret;

            //bla bla ... if an element ist position "fixed" the offsetParent is always zero ....
            //in perspective the getBoundingClientRect() will fail too
            if (node.offsetParent.element != node.element.offsetParent) {
                return ret;
            }

            ret.x += node.offsetParent.clientLeft;
            ret.y += node.offsetParent.clientTop;
        }

        private static getCorrectOffsetFirefox(node: INode, ret: geom.Point2D = new geom.Point2D()): geom.Point2D {
            //no node no value
            if (!node)
                return ret;

            if (!node.offsetParent) {
                if (node.isStatic || node.isRelative) {
                    ret.x += node.root.clientLeft;
                    ret.y += node.root.clientTop;
                }
                return ret;
            }

            if (!node.offsetParent.isBorderBox) {
                ret.x += node.offsetParent.clientLeft;
                ret.y += node.offsetParent.clientTop;
            }

            if (
                (node.isAbsolute || node.isFixedZombie)
                && node.offsetParent.isScrollable
                ) {
                ret.x += node.offsetParent.clientLeft;
                ret.y += node.offsetParent.clientTop;
            }
            
            //if there is not bug to fix
            if (node.offsetParent.element == node.element.offsetParent)
                return ret;
            
            //this should not happen at all
            console.warn("The given offsetParent is maybe wrong.");

            return ret;
        }

        private static getCorrectOffsetWebkit(node: INode, ret: geom.Point2D = new geom.Point2D()): geom.Point2D {
            if (!node || !node.offsetParent)
                return ret;

            var tracked = "b-cont";

            //Why is chrome does not keep care of css-transform on static elements
            //when it comes to the right offsetParent and the offsetTop/offsetLeft values
            if (node.offsetParentRaw != node.offsetParent) {
                //console.warn("The given offsetParent is maybe wrong.");
                
                //trivial if there is a missing offsetParentRaw
                //than just add the already calculated "correct" offset here
                //that is possible because the calculation runs from body -> root
                //the offset sum calculation stops for webkit if the 
                //parentOffsetRaw is null
                //so we have to return the full-offset
                if (!node.offsetParentRaw) {
                    if (
                        true
                        && !node.isTransformed
                        && node.offsetParent
                        && node.offsetParent.isScrollable
                        && node.offsetParent != node.parent
                        && !node.offsetParent.isPreserved3dOrPerspective
                        && node.offsetParent.parent
                        && !node.isPreserved3dOrPerspective
                        && node.parent.isPreserved3dOrPerspective
                        && !node.parent.parent.isPreserved3dOrPerspective
                        ) {
                        ret.x += node.offsetParent.parent.offsetUnscrolled.x;
                        ret.y += node.offsetParent.parent.offsetUnscrolled.y;
                        ret.x -= node.offsetParent.parent.clientLeft;
                        ret.y -= node.offsetParent.parent.clientTop;
                        console.log("Offset - node:", node.element.id, "\t\tnode.relation: ", node.relation.element.id, "\t\tnode.relation.relation: ", node.relation.relation.element.id);
                        return ret;
                    }
                    ret.x += node.relation.offsetUnscrolled.x;
                    ret.y += node.relation.offsetUnscrolled.y;
                }
                else {
                    if (node.isBody || (!node.isAbsolute && node.offsetParent.isBody)) {
                        if (node.element.id == tracked)
                            console.log("A");
                    }
                    else {
                        if (
                            true
                            && node.isAbsolute
                            && node.offsetParent == node.parent
                            && node.parent.isStatic
                            && !node.parent.isPreserved3dOrPerspective
                            && !node.parent.isTransformed
                            ) {

                            if (node.element.id == tracked)
                                console.log("B");
                            
                            //preserved3d is maybe to much
                            ret.x += node.offsetParentRaw.clientLeft;
                            ret.y += node.offsetParentRaw.clientTop;
                        }
                        else {
                            if (node.element.id == tracked)
                                console.log("C");
                            
                            //offset without scroll
                            //the scroll value is already applied or will be applied
                            //for the target node
                            if (!node.isAbsolute) {
                                ret.x -= node.offsetParent.offsetUnscrolled.x - node.offsetParentRaw.offsetLeft;
                                ret.y -= node.offsetParent.offsetUnscrolled.y - node.offsetParentRaw.offsetTop;
                            }
                        }
                    }
                }
            }
            else if (node.offsetParentRaw) {

                if (node.offsetParentRaw.isBody) {
                }
                else if (node.isFixedZombie) {

                }
                else if (true) {
                    if (!node.offsetParentRaw.isStatic) {
                        ret.x += node.offsetParentRaw.clientLeft;
                        ret.y += node.offsetParentRaw.clientTop;
                    }

                }
                //RELATIVE
                else if (node.isRelative && node.offsetParentRaw.isSticked) {
                    ret.x += node.offsetParentRaw.clientLeft;
                    ret.y += node.offsetParentRaw.clientTop;
                }
                else if (node.isRelative && node.offsetParentRaw.isFixedZombie) {
                    ret.x += node.offsetParentRaw.clientLeft;
                    ret.y += node.offsetParentRaw.clientTop;
                }
                else if (node.isRelative && node.offsetParentRaw.isRelative) {
                    ret.x += node.offsetParentRaw.clientLeft;
                    ret.y += node.offsetParentRaw.clientTop;
                }
                //STATIC
                else if (node.isStatic && node.offsetParentRaw.isSticked) {
                    ret.x += node.offsetParentRaw.clientLeft;
                    ret.y += node.offsetParentRaw.clientTop;
                }
                else if (node.isStatic && node.offsetParentRaw.isFixedZombie) {
                    ret.x += node.offsetParentRaw.clientLeft;
                    ret.y += node.offsetParentRaw.clientTop;
                }
                else if (node.isStatic && node.offsetParentRaw.isScrollable) {
                    ret.x += node.offsetParentRaw.clientLeft;
                    ret.y += node.offsetParentRaw.clientTop;
                }
                else if (node.isStatic && node.offsetParentRaw.isTransformed) {
                    ret.x += node.offsetParentRaw.clientLeft;
                    ret.y += node.offsetParentRaw.clientTop;
                }
                else if (node.isStatic && node.offsetParentRaw.isAbsolute) {
                    ret.x += node.offsetParentRaw.clientLeft;
                    ret.y += node.offsetParentRaw.clientTop;
                }
                else if (node.isStatic && node.offsetParentRaw.isRelative) {
                    ret.x += node.offsetParentRaw.clientLeft;
                    ret.y += node.offsetParentRaw.clientTop;
                }
                //ABSOLUTE
                else if (node.isAbsolute && node.offsetParentRaw.isSticked) {
                    ret.x += node.offsetParentRaw.clientLeft;
                    ret.y += node.offsetParentRaw.clientTop;
                }
                else if (node.isAbsolute && node.offsetParentRaw.isFixedZombie) {
                    ret.x += node.offsetParentRaw.clientLeft;
                    ret.y += node.offsetParentRaw.clientTop;
                }
                else if (node.isAbsolute && node.offsetParentRaw.isScrollable) {
                    ret.x += node.offsetParentRaw.clientLeft;
                    ret.y += node.offsetParentRaw.clientTop;
                }
                else if (node.isAbsolute && node.offsetParentRaw.isTransformed) {
                    ret.x += node.offsetParentRaw.clientLeft;
                    ret.y += node.offsetParentRaw.clientTop;
                }
                else if (node.isAbsolute && node.offsetParentRaw.isAbsolute) {
                    ret.x += node.offsetParentRaw.clientLeft;
                    ret.y += node.offsetParentRaw.clientTop;
                }
                else if (node.isAbsolute && node.offsetParentRaw.isRelative) {
                    ret.x += node.offsetParentRaw.clientLeft;
                    ret.y += node.offsetParentRaw.clientTop;
                }
            }

            return ret;
        }
    }
}