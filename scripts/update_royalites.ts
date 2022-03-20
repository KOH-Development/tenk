import { Context } from "near-cli/context";
import { Contract } from "..";


export async function main({ account, argv }: Context) {
  let [contractId] = argv;
  if (contractId === null) {
    console.error("need to supply contract's accountId")
    console.error("... -- <contractId>")
  }
  let contract = new Contract(account, contractId);
  const royalties = {
    percent: 500,
    accounts: {
      "pixelmechwarriors.near": 4000,
      "rovendoug.near": 2000,
      "offseason.near": 2000,
      "shakiev.near": 2000
    }
  };
  let res = await contract.update_royalties({ royalties });
  console.log("Old royalties");
  console.log(res);
  console.log(
    await contract.nft_payout({
      balance: "14285",
      token_id: "1533",
    })
  );
}
