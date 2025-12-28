import { AppController } from "./AppController";
import { QuickDebugLogger } from "./QuickDebugLogger";
import { PageRouter } from "./PageRouter";

QuickDebugLogger.instance.beginListeningForErrors();

const app = new AppController();
