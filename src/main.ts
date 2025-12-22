import { AppController } from "./AppController";
import { QuickDebugLogger } from "./QuickDebugLogger";

QuickDebugLogger.instance.beginListeningForErrors();

const app = new AppController();
