import {
    FileSystemWallet,
    Gateway,
    GatewayOptions,
    X509WalletMixin,
} from "fabric-network";

import {AnimalClass, IAnimal, ProductionType, Species, Status } from "../../contract/src/model";
import { AnimalTracking } from "./AnimalTracking";

import fs = require("fs");
import path = require("path");
import util = require("util");

const readFileAsync = util.promisify(fs.readFile);

const NETWORK_NAME = "channel1";
const CONTRACT_NAMESPACE = "org.example.animaltracking";
const CONTRACT_NAME = "animaltracking-ts";
const MSP_NAME = "org1msp";
let contract:any = null;
const IDENTITY_LABEL = "ibpuser";

//const currentDir = process.cwd();
const currentDir = '/home/demo';
let gw:any = null ; // gateway object set in setupContract, then disconnected in main function

// Wallet directory and Connection Profile sources
const WALLET_DIRECTORY = path.join(currentDir, ".fabric-vscode/wallets/", "ibpuser");
const CCP_FILE = path.join(currentDir, "/", "connection_IBP.json");


export class QueryClient {

    public async run(): Promise<void> {

        const animalTracking = await this.setupContract();
	
        // these fields are just used as placeholders to reference the object.field in the queries executed later on 
	const id = '0000013';
	const species = 'SHEEPGOAT';
	const owner = 'FARMER.JOHN';
	const productionType = 'MEAT';
        console.log('............');

        console.log(' ');
        console.log('Calling queryHist to get the history of Animal with species:' + species + ' and id:' + id);
        console.log('===============================================================================================');
        console.log(' ');
	//const queryResponse = await animalTracking.queryHist(species as Species, id);
	const queryResponse = await contract.evaluateTransaction("queryHist", species as Species, id);

        const file = await fs.writeFileSync('results.json', queryResponse, 'utf8');
        console.log('the query HISTORY response is ' + queryResponse);
        console.log('Transaction complete.');
        console.log(' ');

        console.log(' ');
        console.log('Calling queryByOwner to get the history of animals owned by ' + owner);
        console.log('===========================================================================');
        console.log(' ');
	//const queryResponse2 = await this.animalTracking.queryByOwner(owner);
	const queryResponse2 = await contract.evaluateTransaction("queryByOwner", owner);

        const file2 = await fs.writeFileSync('owners.json', queryResponse2, 'utf8');
        console.log('the query OWNER response is ' + queryResponse2);
        console.log('Transaction complete.');
        console.log(' ');

        console.log(' ');
        console.log('Calling queryAdHoc to get the history of productionTypes = ' + productionType);
        console.log('===========================================================================');
        console.log(' ');
        // if using an index (in time), use this selector instead, where index name is one you've created in your chaincode spec
        //const selector = '{"selector":{"productionType":"' + productionType + '"}, "use_index": "selectByTypeDoc"}';
        const selector = '{"selector":{"productionType":"' + productionType + '"}}';
	//const queryResponse3 = await animalTracking.queryAdHoc(selector);
	const queryResponse3 = await contract.evaluateTransaction("queryAdHoc", selector);

        const file3 = await fs.writeFileSync('adhoc.json', queryResponse3, 'utf8');
        console.log('the query ADHOC response is ' + queryResponse3);
        console.log('Transaction complete.');
        console.log(' ');

        console.log(' ');

        console.log('Calling queryBySpecies to get the list of all SHEEPGOATS registrations ');
        console.log('=======================================================================');
        console.log(' ');
	//const queryResponse4 = await animalTracking.queryBySpecies(species as Species);
	const queryResponse4 = await contract.evaluateTransaction("queryBySpecies", species as Species);

        const file4 = await fs.writeFileSync('registrations.json', queryResponse4, 'utf8');
        console.log('the query OWNERs response is ' + queryResponse4);
        console.log('Transaction complete.');
        console.log(' ');

        console.log('............');
	gw.disconnect();
        
    }

    private async setupContract(): Promise<AnimalTracking> {
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
            discovery: { enabled: true, asLocalhost:false },
            //discovery: { asLocalhost: true, enabled: false }
        };
        const gateway = new Gateway();
        gw = gateway;
        console.log("Reading connection profile file:", CCP_FILE);
        const connectionProfileBuff = await readFileAsync(CCP_FILE);
        const connectionProfile = JSON.parse(connectionProfileBuff.toString("utf8"));

        await gateway.connect(connectionProfile, gatewayOptions);
        const network = await gateway.getNetwork(NETWORK_NAME);
	contract = network.getContract(CONTRACT_NAME, CONTRACT_NAMESPACE);

        return new AnimalTracking(contract);
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
