import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserProvider } from 'ethers';
import { Eip1193Provider } from 'ethers';
import { createFhevmInstance } from '../../fhevmjs';

const AUTHORIZED_CHAIN_ID = ['0xaa36a7', '0x2328', '0x7a69'];

export const Connect: React.FC<{
  children: (account: string, provider: any) => React.ReactNode;
}> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [validNetwork, setValidNetwork] = useState(false);
  const [account, setAccount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAccounts = (accounts: string[]) => {
    setAccount(accounts[0] || '');
    setConnected(accounts.length > 0);
  };

  const hasValidNetwork = async (): Promise<boolean> => {
    const currentChainId: string = (
      await window.ethereum.request({
        method: 'eth_chainId',
      })
    ).toLowerCase();

    return import.meta.env.MOCKED
      ? currentChainId === AUTHORIZED_CHAIN_ID[2]
      : currentChainId === AUTHORIZED_CHAIN_ID[0];
  };

  const refreshNetwork = useCallback(async () => {
    if (await hasValidNetwork()) {
      setValidNetwork(true);
      setLoading(true);
      const load = async () => {
        await createFhevmInstance();
        setLoading(false);
      };
      window.requestAnimationFrame(load);
    } else {
      setValidNetwork(false);
    }
  }, []);

  const refreshProvider = (eth: Eip1193Provider) => {
    const p = new BrowserProvider(eth);
    setProvider(p);
    return p;
  };

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) {
      setError('No wallet has been found');
      return;
    }

    const p = refreshProvider(eth);

    p.send('eth_accounts', [])
      .then(async (accounts: string[]) => {
        refreshAccounts(accounts);
        await refreshNetwork();
      })
      .catch(() => {
        // Do nothing
      });
    eth.on('accountsChanged', refreshAccounts);
    eth.on('chainChanged', refreshNetwork);
  }, []);

  const connect = async () => {
    if (!provider) {
      return;
    }
    const accounts: string[] = await provider.send('eth_requestAccounts', []);

    if (accounts.length > 0) {
      setAccount(accounts[0]);
      setConnected(true);
      if (!(await hasValidNetwork())) {
        await switchNetwork();
      }
    }
  };

  const switchNetwork = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [
          { chainId: AUTHORIZED_CHAIN_ID[import.meta.env.MOCKED ? 2 : 0] },
        ],
      });
    } catch (e) {
      console.error(
        `No ${import.meta.env.MOCKED ? 'Hardhat' : 'Sepolia'} chain configured`,
      );
    }
  }, []);

  const child = useMemo<React.ReactNode>(() => {
    if (!account || !provider) {
      return null;
    }

    if (!validNetwork) {
      return (
        <div className="text-center space-y-4">
          <p className="text-textSecondary">
            You are not on the correct network
          </p>
          <button
            onClick={switchNetwork}
            className="bg-primary hover:bg-primaryHover text-secondary transition-colors duration-200"
          >
            Switch to {import.meta.env.VITE_MOCKED ? 'Hardhat' : 'Sepolia'}
          </button>
        </div>
      );
    }

    if (loading) {
      return <p className="text-center text-textSecondary">Loading...</p>;
    }

    return children(account, provider);
  }, [account, provider, children, validNetwork, loading]);

  if (error) {
    return <p className="text-center text-textSecondary">No wallet found.</p>;
  }

  const connectInfos = (
    <div className="flex justify-center items-center space-x-4 mb-6">
      {!connected && (
        <button
          onClick={connect}
          className="bg-primary hover:bg-primaryHover text-secondary px-6 py-2 rounded-lg transition-colors duration-200"
        >
          Connect wallet
        </button>
      )}
      {connected && (
        <div className="text-textSecondary">
          Connected with{' '}
          <span className="text-primary font-medium">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {connectInfos}
      <div className="w-full">{child}</div>
    </div>
  );
};
