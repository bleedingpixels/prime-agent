import { ensureKernelPython } from "./bootstrap.js";
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
try {
    const python = await ensureKernelPython();
    console.log(`kernel python: ${python}`);
}
catch (error) {
    console.error(errorMessage(error));
    process.exit(1);
}
//# sourceMappingURL=bootstrap-cli.js.map