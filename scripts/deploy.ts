import { NEAR, Gas } from "near-units";
import { readFile } from "fs/promises";
import { Context } from "near-cli/context";
import * as tenk from "..";
import { binPath } from "./utils";
import { icon } from "./icon";

const metadata: tenk.InitialMetadata = {
  uri: "https://bafybeifry66qavug4hbo2kaa5brsltcr73yeax4b6sstf2dbrlr2kj6gj4.ipfs.dweb.link",
  name: "Pixlemech Warriors",
  symbol: "PMWR",
  icon,
};

const size = 600;

const sale: tenk.Sale = {
  presale_start: Date.parse("19 Apr 2022 18:00 UTC"),
  public_sale_start: Date.parse("19 Apr 2022 19:00 UTC"),
  price: NEAR.parse("5 N").toJSON(),

  allowance: 2,
  initial_royalties: {
    percent: 10_000,
    accounts: {
      "pixlemechwarriors.near": 6_000,
      "offseason.near": 2_000,
      "shakiev.near": 2_000
    },
  },
  royalties: {
    percent: 600,
    accounts: {
      "pixelmechwarriors.near": 4_000,
      "rovendoug.near": 2_000,
      "offseason.near": 2_000,
      "shakiev.near": 2_000
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
  }
  const initialArgs = {
    owner_id: account.accountId,
    metadata,
    size,
    sale,
  };

  const contract = new tenk.Contract(account, contractId);

  const tx = account
    .createTransaction(contractId)
    .deployContract(contractBytes);

  if (await contractAccount.hasDeployedContract()) {
    console.log(`initializing with: \n${JSON.stringify(initialArgs, null, 2)}`);
    tx.actions.push(
      contract.new_default_metaTx(initialArgs, { gas: Gas.parse("50Tgas") })
    );
  }
  let res = await tx.signAndSend();
  console.log(
    `https://explorer${isTestnet ? ".testnet" : ""}.near.org/transactions/${res.transaction_outcome.id
    }`
  );
  //@ts-ignore
  if (res.status.SuccessValue != undefined) {
    console.log(`deployed ${contractId}`);
  } else {
    console.log(res);
  }
}
