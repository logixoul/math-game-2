
import { AppController } from "./AppController.js";
import { installErrorReporter } from "./debug.js";
import { FirebaseController } from "./Firebase.js";

// install error reporter to show runtime errors on the page
installErrorReporter();
let firebaseController = new FirebaseController();
firebaseController.init();

const app = new AppController();
