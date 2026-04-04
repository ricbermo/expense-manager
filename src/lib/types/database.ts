export type AccountType = "savings" | "cash" | "credit_card" | "loan";
export type TransactionType = "expense" | "income" | "transfer";
export type CategoryType = "expense" | "income";

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
  created_at: string;
}

export interface Budget {
  id: string;
  name: string;
  category_id: string;
  month: string;
  limit_amount: number;
}

// Supabase Database type for client typing
export type Database = {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Category>;
        Relationships: [];
      };
      accounts: {
        Row: Account;
        Insert: Omit<Account, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Account>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Transaction>;
        Relationships: [];
      };
      budgets: {
        Row: Budget;
        Insert: Omit<Budget, "id"> & { id?: string };
        Update: Partial<Budget>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
