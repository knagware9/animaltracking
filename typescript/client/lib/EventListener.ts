// tslint:disable:no-console

import { EventClient } from "./EventClient";

const client = new EventClient();

(async () => {

    try {
    await (client.run())
    console.log("Running....");
    }
    catch(error) {
         console.error;
    }
 })();

