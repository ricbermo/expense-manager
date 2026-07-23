export type AccountType = "savings" | "cash" | "credit_card" | "loan";
export type TransactionType = "expense" | "income" | "transfer";
export type CategoryType = "expense" | "income";
export type TransactionStatus = "confirmed" | "pending";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  created_at: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  credit_limit: number | null;
  interest_rate: number | null;
  due_day: number | null;
  archived_at: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  date: string;
  category_id: string | null;
  budget_id: string | null;
  related_expense_id: string | null;
  account_id: string;
  to_account_id: string | null;
  tags: string[];
  installments: number | null;
  is_occasional: boolean;
  status: TransactionStatus;
  created_at: string;
}

export interface Budget {
  id: string;
  name: string;
  category_id: string;
  month: string;
  limit_amount: number;
}

export interface CreditCardStatement {
  id: string;
  account_id: string;
  statement_date: string;
  total_balance: number;
  minimum_payment: number;
  due_date: string;
  paid_at: string | null;
  payment_transaction_id: string | null;
  created_at: string;
}

export interface CreditCardStatementPayment {
  id: string;
  statement_id: string;
  transaction_id: string;
  amount: number;
  created_at: string;
}

type CreditCardStatementRow = CreditCardStatement & { user_id: string };
type CreditCardStatementPaymentRow = CreditCardStatementPayment & {
  user_id: string;
};

// Supabase Database type for client typing
export type Database = {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Category>;
        Relationships: [];
      };
      accounts: {
        Row: Account;
        Insert: Omit<Account, "id" | "created_at" | "archived_at"> & {
          id?: string;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<Account>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at" | "status"> & {
          id?: string;
          created_at?: string;
          status?: TransactionStatus;
        };
        Update: Partial<Transaction>;
        Relationships: [];
      };
      budgets: {
        Row: Budget;
        Insert: Omit<Budget, "id"> & { id?: string };
        Update: Partial<Budget>;
        Relationships: [];
      };
      credit_card_statements: {
        Row: CreditCardStatementRow;
        Insert: Omit<
          CreditCardStatementRow,
          "id" | "created_at" | "paid_at" | "payment_transaction_id" | "user_id"
        > & {
          id?: string;
          created_at?: string;
          paid_at?: string | null;
          payment_transaction_id?: string | null;
          user_id?: string;
        };
        Update: Partial<CreditCardStatementRow>;
        Relationships: [];
      };
      credit_card_statement_payments: {
        Row: CreditCardStatementPaymentRow;
        Insert: Omit<
          CreditCardStatementPaymentRow,
          "id" | "created_at" | "user_id"
        > & {
          id?: string;
          created_at?: string;
          user_id?: string;
        };
        Update: Partial<CreditCardStatementPaymentRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      record_credit_card_statement_payment: {
        Args: {
          p_statement_id: string;
          p_source_account_id: string;
          p_amount: number;
          p_date: string;
          p_description?: string | null;
        };
        Returns: {
          transaction_id: string;
          remaining_amount: number;
          settled: boolean;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
