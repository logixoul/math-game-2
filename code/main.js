import { AppController } from "./AppController.js";
import { QuickDebugLogger } from "./QuickDebugLogger.js";

QuickDebugLogger.instance.beginListeningForErrors();

const app = new AppController();
