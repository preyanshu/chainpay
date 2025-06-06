import { verifyTransaction } from "./verifytransaction";

(async () => {
    const paymentId = "payment_abc123"; // Replace with a real payment ID
    const txHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"; // Replace with a real tx hash
  
    try {
      const result = await verifyTransaction(paymentId, 3);
      console.log("Transaction verification result:", result);
    } catch (error) {
      console.error("Error during transaction verification:", error);
    }
  })();