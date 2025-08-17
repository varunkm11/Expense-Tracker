import { UserBalance } from '../models/UserBalance';
import { User } from '../models/User';

export class BalanceManager {
  /**
   * Encode email to be safe for use as MongoDB Map key
   * Replace dots with __DOT__ to avoid MongoDB Map key restrictions
   */
  private static encodeEmail(email: string): string {
    return email.replace(/\./g, '__DOT__');
  }

  /**
   * Decode email from MongoDB Map key back to original email
   */
  private static decodeEmail(encodedEmail: string): string {
    return encodedEmail.replace(/__DOT__/g, '.');
  }

  /**
   * Update balance when a split expense is created
   * @param payerEmail - Person who paid the full amount
   * @param splitDetails - Array of {email, amount} for each person's share
   */
  static async updateBalancesForSplitExpense(
    payerEmail: string, 
    splitDetails: Array<{email: string, amount: number}>
  ) {
    try {
      // Get or create balance record for payer
      let payerBalance = await UserBalance.findOne({ userEmail: payerEmail });
      if (!payerBalance) {
        const payerUser = await User.findOne({ email: payerEmail });
        if (!payerUser) throw new Error('Payer user not found');
        
        payerBalance = new UserBalance({
          userId: payerUser._id,
          userEmail: payerEmail,
          balances: new Map(),
          totalOwed: 0,
          totalOwing: 0
        });
      }

      // Update balances for each participant
      for (const { email, amount } of splitDetails) {
        if (email === payerEmail) continue; // Skip the payer

        const encodedEmail = this.encodeEmail(email);
        const encodedPayerEmail = this.encodeEmail(payerEmail);

        // Update payer's balance (they are owed money)
        const currentOwed = payerBalance.balances.get(encodedEmail) || 0;
        payerBalance.balances.set(encodedEmail, currentOwed + amount);
        payerBalance.totalOwed += amount;

        // Update participant's balance (they owe money)
        let participantBalance = await UserBalance.findOne({ userEmail: email });
        if (!participantBalance) {
          const participantUser = await User.findOne({ email: email });
          if (!participantUser) continue; // Skip if user not found
          
          participantBalance = new UserBalance({
            userId: participantUser._id,
            userEmail: email,
            balances: new Map(),
            totalOwed: 0,
            totalOwing: 0
          });
        }

        const currentOwing = participantBalance.balances.get(encodedPayerEmail) || 0;
        participantBalance.balances.set(encodedPayerEmail, currentOwing - amount);
        participantBalance.totalOwing += amount;

        await participantBalance.save();
      }

      await payerBalance.save();
    } catch (error) {
      console.error('Error updating balances for split expense:', error);
      throw error;
    }
  }

  /**
   * Update balance when someone pays their share
   * @param payerEmail - Person who originally paid the full amount
   * @param participantEmail - Person who is now paying their share
   * @param amount - Amount being paid
   */
  static async settlePayment(payerEmail: string, participantEmail: string, amount: number) {
    try {
      const encodedParticipantEmail = this.encodeEmail(participantEmail);
      const encodedPayerEmail = this.encodeEmail(payerEmail);

      // Update payer's balance (reduce what they're owed)
      const payerBalance = await UserBalance.findOne({ userEmail: payerEmail });
      if (payerBalance) {
        const currentOwed = payerBalance.balances.get(encodedParticipantEmail) || 0;
        const newOwed = currentOwed - amount;
        
        if (newOwed <= 0) {
          payerBalance.balances.delete(encodedParticipantEmail);
        } else {
          payerBalance.balances.set(encodedParticipantEmail, newOwed);
        }
        
        payerBalance.totalOwed -= amount;
        await payerBalance.save();
      }

      // Update participant's balance (reduce what they owe)
      const participantBalance = await UserBalance.findOne({ userEmail: participantEmail });
      if (participantBalance) {
        const currentOwing = participantBalance.balances.get(encodedPayerEmail) || 0;
        const newOwing = currentOwing + amount; // Adding because it was negative
        
        if (newOwing >= 0) {
          participantBalance.balances.delete(encodedPayerEmail);
        } else {
          participantBalance.balances.set(encodedPayerEmail, newOwing);
        }
        
        participantBalance.totalOwing -= amount;
        await participantBalance.save();
      }
    } catch (error) {
      console.error('Error settling payment:', error);
      throw error;
    }
  }

  /**
   * Get balance summary for a user
   * @param userEmail - User's email
   */
  static async getUserBalanceSummary(userEmail: string) {
    try {
      const balance = await UserBalance.findOne({ userEmail });
      if (!balance) {
        return {
          totalOwed: 0,
          totalOwing: 0,
          balances: {},
          netBalance: 0
        };
      }

      const balancesObj: {[email: string]: number} = {};
      balance.balances.forEach((amount, encodedEmail) => {
        const decodedEmail = this.decodeEmail(encodedEmail);
        balancesObj[decodedEmail] = amount;
      });

      return {
        totalOwed: balance.totalOwed,
        totalOwing: balance.totalOwing,
        balances: balancesObj,
        netBalance: balance.totalOwed - balance.totalOwing
      };
    } catch (error) {
      console.error('Error getting user balance summary:', error);
      throw error;
    }
  }

  /**
   * Get all balances between two users
   * @param userEmail1 - First user's email
   * @param userEmail2 - Second user's email
   */
  static async getBalanceBetweenUsers(userEmail1: string, userEmail2: string) {
    try {
      const encodedUser1Email = this.encodeEmail(userEmail1);
      const encodedUser2Email = this.encodeEmail(userEmail2);

      const balance1 = await UserBalance.findOne({ userEmail: userEmail1 });
      const amount1owes2 = balance1?.balances.get(encodedUser2Email) || 0;
      
      const balance2 = await UserBalance.findOne({ userEmail: userEmail2 });
      const amount2owes1 = balance2?.balances.get(encodedUser1Email) || 0;

      // Calculate net balance (positive means user1 is owed money, negative means user1 owes money)
      const netBalance = amount1owes2 - Math.abs(amount2owes1);

      return {
        user1OwesUser2: amount1owes2 > 0 ? amount1owes2 : 0,
        user2OwesUser1: Math.abs(amount2owes1) > 0 ? Math.abs(amount2owes1) : 0,
        netBalance,
        summary: netBalance > 0 
          ? `${userEmail2} owes ${userEmail1} ₹${netBalance}`
          : netBalance < 0 
          ? `${userEmail1} owes ${userEmail2} ₹${Math.abs(netBalance)}`
          : 'All settled up'
      };
    } catch (error) {
      console.error('Error getting balance between users:', error);
      throw error;
    }
  }
}
