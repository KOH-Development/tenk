import { NEAR, Gas } from "near-units";
import { readFile } from "fs/promises";
import { Context } from "near-cli/context";
import * as tenk from "..";
import { binPath } from "./utils";
import {icon} from "./icon";

const metadata: tenk.InitialMetadata = {
  uri: "https://bafybeicg2vwlwvx7psn2zxdxe4bu3f6lms3gdf64xixsv5tmm2wksxygj4.ipfs.dweb.link/",
  name: "Pixelmech Warriors NFT",
  symbol: "PMW0",
  icon,
};

const size = 750;
 
const sale: tenk.Sale = {
  price: NEAR.parse("5 N").toJSON(),
  presale_price: NEAR.parse("4 N").toJSON(),
  mint_rate_limit: 5,
  presale_start: Date.parse("1 May 2022 12:00 PM UTC"),
  public_sale_start: Date.parse("1 May 2022 6:00 PM UTC"),
  allowance: null,
  initial_royalties: {
    percent: 10000,
    accounts: {
      "pixelmechwarriors.near": 6000,
      "offseason.near": 2000,
      "shakiev.near": 2000,
    },
  },
  royalties: {
    percent: 600,
    accounts: {
      "pixelmechwarriors.near": 4000,
      "offseason.near": 3000,
      "shakiev.near": 3000,
    },
  },
};


export async function main({ account, nearAPI, argv, near }: Context) {
  let { Account } = nearAPI;
  const contractBytes = await readFile(binPath("tenk"));

  let [contractId] = argv ?? [];
  contractId = contractId ?? account.accountId;
  let contractAccount = new Account(near.connection, contractId);

  const isTestnet = contractId.endsWith("testnet");
  if (isTestnet) {
    sale.initial_royalties = null;
    sale.public_sale_start = Date.now();
  }

  const initialArgs = {
    owner_id: account.accountId,
    metadata,
    size,
    sale,
  };

  ///console.log(JSON.stringify(initialArgs, null, 2));

  const contract = new tenk.Contract(account, contractId);
  console.log(JSON.stringify(account, null, 2));
  const tx = account
    .createTransaction(contractId)
    .deployContract(contractBytes);

    console.log(await contractAccount.hasDeployedContract());
  if (await contractAccount.hasDeployedContract()) {
    console.log(`initializing with: \n${JSON.stringify(initialArgs, null, 2)}`);
    tx.actions.push(
      contract.new_default_metaTx(initialArgs, { gas: Gas.parse("50Tgas") })
    );
  } else {
    tx.actions.push(
      contract.migrate_metaTx(initialArgs, { gas: Gas.parse("50Tgas") })
    );
  }

  let res = await tx.signAndSend();
  console.log(
    `https://explorer${isTestnet ? ".testnet" : ""}.near.org/transactions/${
      res.transaction_outcome.id
    }`
  );
  //@ts-ignore
  if (res.status.SuccessValue != undefined) {
    console.log(`deployed ${contractId}`);
  } else {
    console.log(res);
  }
}
