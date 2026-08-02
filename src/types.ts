export type TabType = 'home' | 'history' | 'reports' | 'profile';

export interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  icon: string;
}
