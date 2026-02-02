import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy FlashFactory
  console.log("\n📦 Deploying FlashFactory...");
  const FlashFactory = await ethers.getContractFactory("FlashFactory");
  const factory = await FlashFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ FlashFactory deployed to:", factoryAddress);

  // Deploy tokens via factory
  const tokens = [
    { name: "Flash USDT", symbol: "USDT", decimals: 6 },
    { name: "Flash BTC", symbol: "BTC", decimals: 8 },
    { name: "Flash ETH", symbol: "ETH", decimals: 18 },
    { name: "Flash BNB", symbol: "BNB", decimals: 18 },
  ];

  console.log("\n🪙 Deploying tokens...");
  for (const token of tokens) {
    const tx = await factory.createToken(token.name, token.symbol, token.decimals);
    await tx.wait();
    const tokenAddress = await factory.getToken(token.symbol);
    console.log(`✅ ${token.symbol} deployed to:`, tokenAddress);
  }

  console.log("\n========================================");
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("========================================");
  console.log("\nFlashFactory:", factoryAddress);
  console.log("\nNext steps:");
  console.log("1. Open Admin Panel in the app");
  console.log("2. Add your wallet as admin in Settings");
  console.log("3. Add token contracts with addresses above");
  console.log("========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
