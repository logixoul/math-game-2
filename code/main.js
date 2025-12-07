import { AppController } from "./AppController.js";
import { QuickDebugLogger } from "./QuickDebugLogger.js";
import { FirebaseController } from "./FirebaseController.js";

QuickDebugLogger.instance.beginListeningForErrors();

let firebaseController = new FirebaseController();
firebaseController.init();

const app = new AppController();
