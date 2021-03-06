namespace jsidea.events {
    interface ISignal {
        clear(): void;
    }
    interface ISignal1<Data0> extends ISignal {
        add(listener: (data: Data0) => void): Slot;
        invoke(p0: Data0): void;
    }
    interface ISignal2<Data0, Data1> extends ISignal {
        add(listener: (data0: Data0, data1: Data1) => void): Slot;
        invoke(p0: Data0, p1: Data1): void;
    }
    interface ISignal3<Data0, Data1, Data2> extends ISignal {
        add(listener: (data0: Data0, data1: Data1, data2: Data2) => void): Slot;
        invoke(p0: Data0, p1: Data1, p2: Data2): void;
    }
    interface ISignal4<Data0, Data1, Data2, Data3> extends ISignal {
        add(listener: (data0: Data0, data1: Data1, data2: Data2, data3: Data3) => void): Slot;
        invoke(p0: Data0, p1: Data1, p2: Data2, p3: Data3): void;
    }
    interface ISignal5<Data0, Data1, Data2, Data3, Data4> extends ISignal {
        add(listener: (data0: Data0, data1: Data1, data2: Data2, data3: Data3, data4: Data4) => void): Slot;
        invoke(p0: Data0, p1: Data1, p2: Data2, p3: Data3, p4: Data4): void;
    }
    export class Signal {
        private _slots: Slot[] = [];

        public add(listener: (...args: any[]) => void): Slot {
            var slot = new Slot(this, listener);
            this._slots.push(slot);
            return slot;
        }

        public invoke(...args: any[]): void {
            var l = this._slots.length;
            for (var i = 0; i < l; ++i) {
                var slot = this._slots[i];
                try {
                    slot.invoke(args);
                } catch (exc) {
                    
                }
                if (l != this._slots.length) {
                    i--;
                    l--;
                }
            }
        }

        public clear(): void {
            this._slots.splice(0, this._slots.length);
        }

        public static create<T0>(): ISignal1<T0>;
        public static create<T0, T1>(): ISignal2<T0, T1>;
        public static create<T0, T1, T2>(): ISignal3<T0, T1, T2>;
        public static create<T0, T1, T2, T3>(): ISignal4<T0, T1, T2, T3>;
        public static create<T0, T1, T2, T3, T4>(): ISignal5<T0, T1, T2, T3, T4>;
        public static create(): Signal {
            return new Signal();
        }
    }
}