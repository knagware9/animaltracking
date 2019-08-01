// tslint:disable:no-console

import { EventClient } from "./EventClient_IBP";

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

