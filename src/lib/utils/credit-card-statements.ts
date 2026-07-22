import type { Account } from "@/lib/types/database";

export interface StatementPayment {
  transaction_id: string;
  amount: number;
}

export interface StatementPaymentSource {
  total_balance: number;
  due_date: string;
  payments: StatementPayment[];
}

export function getStatementPaymentSummary(statement: StatementPaymentSource) {
  const transactionIds = new Set<string>();
  const paidAmount = statement.payments.reduce((sum, payment) => {
    if (transactionIds.has(payment.transaction_id)) {
      return sum;
    }

    transactionIds.add(payment.transaction_id);
    return sum + Math.max(0, payment.amount);
  }, 0);
  const remainingAmount = Math.max(0, statement.total_balance - paidAmount);

  return {
    paidAmount: Math.min(paidAmount, statement.total_balance),
    remainingAmount,
    isPaid: remainingAmount === 0,
  };
}

export function getOpenStatements<T extends StatementPaymentSource>(
  statements: T[],
) {
  return statements
    .filter((statement) => !getStatementPaymentSummary(statement).isPaid)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

export function orderAccountsForReconciliation<
  T extends Pick<Account, "id" | "name" | "type">,
>(
  accounts: T[],
  statements: (StatementPaymentSource & { account_id: string })[],
) {
  const nextDueByAccountId = new Map(
    getOpenStatements(statements).map((statement) => [
      statement.account_id,
      statement.due_date,
    ]),
  );

  return [...accounts].sort((a, b) => {
    const aDueDate = nextDueByAccountId.get(a.id);
    const bDueDate = nextDueByAccountId.get(b.id);

    if (aDueDate && bDueDate) return aDueDate.localeCompare(bDueDate);
    if (aDueDate) return -1;
    if (bDueDate) return 1;
    return a.name.localeCompare(b.name, "es");
  });
}

export function validateStatement({
  totalBalance,
  minimumPayment,
  statementDate,
  dueDate,
}: {
  totalBalance: number;
  minimumPayment: number;
  statementDate: string;
  dueDate: string;
}) {
  if (totalBalance <= 0)
    return "El saldo del extracto debe ser mayor que cero.";
  if (minimumPayment <= 0) return "El pago mínimo debe ser mayor que cero.";
  if (minimumPayment > totalBalance) {
    return "El pago mínimo no puede superar el saldo del extracto.";
  }
  if (dueDate < statementDate) {
    return "La fecha límite no puede ser anterior a la fecha del extracto.";
  }

  return null;
}

export function validateStatementPayment({
  amount,
  remainingAmount,
  sourceBalance,
}: {
  amount: number;
  remainingAmount: number;
  sourceBalance: number;
}) {
  if (amount <= 0) return "El monto debe ser mayor que cero.";
  if (amount > remainingAmount)
    return "El monto supera el saldo pendiente del extracto.";
  if (amount > sourceBalance)
    return "La cuenta de origen no tiene saldo suficiente.";

  return null;
}

export function getAccountBalances(
  accounts: Pick<Account, "type" | "balance">[],
) {
  return accounts.reduce(
    (totals, account) => {
      if (account.type === "savings" || account.type === "cash") {
        totals.liquidFunds += account.balance;
      }
      if (account.type === "credit_card") {
        totals.cardDebt += Math.abs(Math.min(0, account.balance));
      }
      totals.netPosition += account.balance;
      return totals;
    },
    { liquidFunds: 0, cardDebt: 0, netPosition: 0 },
  );
}
