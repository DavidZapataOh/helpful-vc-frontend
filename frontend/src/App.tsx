import { useEffect, useState } from 'react';
import { Devnet } from './components/Devnet';
import { init } from './fhevmjs';
import './App.css';
import { Connect } from './components/Connect';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    init()
      .then(() => {
        setIsInitialized(true);
      })
      .catch(() => setIsInitialized(false));
  }, []);

  if (!isInitialized) return null;

  return (
    <div className="bg-background min-h-screen w-full">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold text-secondary text-center">
          Confidential ERC20 dApp
        </h1>
        <Connect>
          {(account, provider) => (
            <Devnet account={account} provider={provider} />
          )}
        </Connect>
        <p className="mt-8 text-center text-textSecondary">
          <a 
            href="https://docs.zama.ai/fhevm"
            className="hover:text-primary transition-colors duration-200"
          >
            See the documentation for more information
          </a>
        </p>
      </div>
    </div>
  );
}

export default App;
