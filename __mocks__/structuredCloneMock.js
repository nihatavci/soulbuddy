/**
 * Mock for @ungap/structured-clone
 * Returns Node.js's native structuredClone (available in Node 17+)
 * so the expo winter runtime lazy getter doesn't fail in Jest.
 */
module.exports = { default: globalThis.structuredClone ?? ((x) => JSON.parse(JSON.stringify(x))) };
