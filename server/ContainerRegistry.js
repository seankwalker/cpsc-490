/**
 * ContainerRegistry.js
 * Sean Walker
 * CPSC 490
 *
 * Maps VNF service chains to containers and their remaining client capacity.
 */

export default class ContainerRegistry extends Map {
    // get key based on object string: since we care about the contents and
    // exact ordering, this sort of deep object comparison is perfect
    get(key) {
        return super.get(JSON.stringify(key));
    }

    has(key) {
        return super.has(JSON.stringify(key));
    }

    set(key, value) {
        return super.set(JSON.stringify(key), value);
    }
}
