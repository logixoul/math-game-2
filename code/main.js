
import { AppController } from "./AppController.js";
import { installErrorReporter } from "./debug.js";

// install error reporter to show runtime errors on the page
installErrorReporter();

const app = new AppController();
