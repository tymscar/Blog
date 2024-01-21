let wasm;

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
/**
*/
export class Entity {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Entity.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_entity_free(ptr);
    }
    /**
    * @param {number} x
    * @param {number} y
    * @param {number} dx
    * @param {number} dy
    * @returns {Entity}
    */
    static new(x, y, dx, dy) {
        const ret = wasm.entity_new(x, y, dx, dy);
        return Entity.__wrap(ret);
    }
}
/**
*/
export class State {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(State.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_state_free(ptr);
    }
    /**
    * @param {number} canvas_size
    * @param {number} circle_size
    * @param {number} repulsion_strength
    * @returns {State}
    */
    static new(canvas_size, circle_size, repulsion_strength) {
        const ret = wasm.state_new(canvas_size, circle_size, repulsion_strength);
        return State.__wrap(ret);
    }
    /**
    * @returns {number}
    */
    get_amount_of_circles() {
        const ret = wasm.state_get_amount_of_circles(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} canvas_size
    */
    update_canvas_size(canvas_size) {
        wasm.state_update_canvas_size(this.__wbg_ptr, canvas_size);
    }
    /**
    * @param {number} x
    * @param {number} y
    */
    add_soap(x, y) {
        wasm.state_add_soap(this.__wbg_ptr, x, y);
    }
    /**
    */
    reset() {
        wasm.state_reset(this.__wbg_ptr);
    }
    /**
    */
    tick() {
        wasm.state_tick(this.__wbg_ptr);
    }
    /**
    * @returns {number}
    */
    get_positions_ptr() {
        const ret = wasm.state_get_positions_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

function __wbg_init_memory(imports, maybe_memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedUint8Memory0 = null;


    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(input) {
    if (wasm !== undefined) return wasm;

    if (typeof input === 'undefined') {
        input = new URL('soap_sim_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await input, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync }
export default __wbg_init;
