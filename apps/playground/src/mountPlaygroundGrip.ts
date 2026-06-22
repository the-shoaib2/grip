import { mountFloatingGrip } from "@grip/devtools-floating";
import { playgroundRuntime } from "./mockRuntime";

const controller = mountFloatingGrip(playgroundRuntime);
controller.setOpen(true);
