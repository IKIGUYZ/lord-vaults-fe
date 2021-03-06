import { createReducer } from '@reduxjs/toolkit';
import {
  addTransaction,
  checkedTransaction,
  clearAllTransactions,
  finalizeTransaction,
  SerializableTransactionReceipt,
} from './actions';

const now = () => new Date().getTime();

export type ErrorReporter = 'comptroller' | 'token';
export interface TransactionDetails {
  hash: string;
  approval?: { tokenAddress: string; spender: string };
  redemption?: { poolAddress: string };
  from: string;
  summary?: string;
  receipt?: SerializableTransactionReceipt;
  lastCheckedBlockNumber?: number;
  addedTime: number;
  confirmedTime?: number;
  failure?: number[];
  errorReporter?: ErrorReporter;
}

export interface TransactionState {
  [chainId: number]: {
    [txHash: string]: TransactionDetails;
  };
}

export const initialState: TransactionState = {};

export default createReducer(initialState, (builder) =>
  builder
    .addCase(
      addTransaction,
      (
        transactions,
        { payload: { chainId, hash, from, approval, summary, redemption, errorReporter } },
      ) => {
        if (transactions[chainId]?.[hash]) {
          return;
        }
        const txs = transactions[chainId] ?? {};
        txs[hash] = {
          hash,
          from,
          approval,
          summary,
          redemption,
          addedTime: now(),
          errorReporter,
        };
        transactions[chainId] = txs;
      },
    )
    .addCase(clearAllTransactions, (transactions, { payload: { chainId } }) => {
      if (!transactions[chainId]) return;
      transactions[chainId] = {};
    })
    .addCase(
      checkedTransaction,
      (transactions, { payload: { chainId, hash, blockNumber } }) => {
        const tx = transactions[chainId]?.[hash];
        if (!tx) {
          return;
        }
        if (!tx.lastCheckedBlockNumber) {
          tx.lastCheckedBlockNumber = blockNumber;
        } else {
          tx.lastCheckedBlockNumber = Math.max(blockNumber, tx.lastCheckedBlockNumber);
        }
      },
    )
    .addCase(finalizeTransaction, (transactions, { payload: { hash, chainId, receipt } }) => {
      const tx = transactions[chainId]?.[hash];
      if (!tx) {
        return;
      }
      tx.receipt = receipt;
      tx.confirmedTime = now();
    }),
);
