import { AppController } from "./AppController";
import { QuickDebugLogger } from "./QuickDebugLogger";
import { PageRouter } from "./PageRouter";

QuickDebugLogger.instance.beginListeningForErrors();

new PageRouter("dashboard");
const app = new AppController();
