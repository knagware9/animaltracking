import {
    FileSystemWallet,
    Gateway,
    GatewayOptions,
    X509WalletMixin,
} from "fabric-network";
import {EventEmitter} from 'events';

import {AnimalClass, IAnimal, ProductionType, Species, Status } from "../../contract/src/model";
import { AnimalTracking } from "./AnimalTracking";

import fs = require("fs");
import path = require("path");
import util = require("util");

const readFileAsync = util.promisify(fs.readFile);

const NETWORK_NAME = "mychannel";
const CONTRACT_NAMESPACE = "org.example.animaltracking";
const CONTRACT_NAME = "animaltracking-ts";
const EVENT_NAME = "animaltracking-ev";
const LISTENER_NAME = "animaltracking-ls";
const MSP_NAME = "Org1MSP";

const IDENTITY_LABEL = "admin";

// const currentDir = process.cwd();
const currentDir = '/home/demo';

// Wallet directory and Connection Profile sources
const WALLET_DIRECTORY = path.join(currentDir, ".fabric-vscode/wallets/", "local_fabric_wallet");
const CCP_FILE = path.join(currentDir, "/", "connection.json");

// The instantiable class for running the Event Listener

export class EventClient extends EventEmitter {

    public async run(): Promise<void> {

        console.log(' ');
        console.log('This is the Event Client run from EventListener.ts wrapper ');
        console.log('===============================================================================================');
        console.log(' ');
        console.log('............');
        // set up the wallet location
        const wallet = await this.createWallet();
        // check if our Identity has cert/key wallet
        const check = await this.checkWallet(wallet);
        if (check === "NO_ID") 
            console.log("sorry, no Identity to interact with the Contract....");
        else
            console.log("setup/found Wallet location, setting up Gateway ....");

        const gatewayOptions: GatewayOptions = {
            identity: IDENTITY_LABEL,
            wallet,
	    discovery: { enabled: true, asLocalhost: true },
        };
        const gateway = new Gateway();

        console.log("Reading connection profile file:", CCP_FILE);
        const connectionProfileBuff = await readFileAsync(CCP_FILE);
        const connectionProfile = JSON.parse(connectionProfileBuff.toString("utf8"));

        await gateway.connect(connectionProfile, gatewayOptions);
        console.log("Getting network..."); 
        const network = await gateway.getNetwork(NETWORK_NAME);
        console.log("Getting contract..."); 
        const contract = network.getContract(CONTRACT_NAME, CONTRACT_NAMESPACE);
        console.log("Getting listener..."); 
	// zap the events.json file
	const file1 = fs.writeFileSync('events.json', '');
	
	const listener = await contract.addContractListener(LISTENER_NAME, EVENT_NAME, (error: Error, event: any, blockNumber: string, transactionId: string, status: string): any  => {
            if (error) {
               console.error(error);
            return;
            }
            console.log(`Block Number: ${blockNumber} Transaction ID: ${transactionId} Status: ${status}`);
	    if (status && status === 'VALID') {
	            console.log('Payload Details:');
		    let evt = event.payload.toString('utf8');
                    let evt1 = JSON.parse(evt);
		    console.log('Event PAYLOAD is ' + event.payload.toString('utf8'));
		    //const file = fs.writeFileSync('events.json', evt, 'utf8');
		    const file = fs.appendFileSync('rawevents.json', evt);

                    if (Array.isArray(evt1)) {
                        for(const oneEvent of evt1) {
                            this.emit('ContractEvent: ', oneEvent);
                        }
                    }
                    else {
                        this.emit('ContractEvent  - single', evt1);
                    }
            }
	    } ,
	     {filtered: false}
	);

    }

    private async createWallet(): Promise<FileSystemWallet> {
        // console.log("Using wallet directory:", WALLET_DIRECTORY);
        const wallet = new FileSystemWallet(WALLET_DIRECTORY);
        return wallet;
    }

    private async checkWallet(wallet: FileSystemWallet): Promise<string> {
        const identityExists = await wallet.exists(IDENTITY_LABEL);
        if (identityExists) {
            return "GOOD";
        } else {
            // console.log("No identity credentials found for " + IDENTITY_LABEL);
            return "NO_ID";
        }
    }
}
