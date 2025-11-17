
import { AppController } from "./AppController.js";
import { installErrorReporter } from "./debug.js";
import { initFirebase } from "./Firebase.js";

// install error reporter to show runtime errors on the page
installErrorReporter();
initFirebase();

const app = new AppController();
