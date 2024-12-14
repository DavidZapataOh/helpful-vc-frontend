import { useEffect, useState } from 'react';
import { getInstance } from '../../fhevmjs';
import { Eip1193Provider, ZeroAddress } from 'ethers';
import { ethers } from 'ethers';
import { reencryptEuint64 } from '../../../../hardhat/test/reencrypt.ts';

const toHexString = (bytes: Uint8Array) =>
  '0x' +
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

export type DevnetProps = {
  account: string;
  provider: Eip1193Provider;
};

export const Devnet = ({ account, provider }: DevnetProps) => {
  const [contractAddress, setContractAddress] = useState(ZeroAddress);
  const [handleBalance, setHandleBalance] = useState('0');
  const [decryptedBalance, setDecryptedBalance] = useState('???');
  const [handles, setHandles] = useState<Uint8Array[]>([]);
  const [encryption, setEncryption] = useState<Uint8Array>();
  const [inputValue, setInputValue] = useState('');
  const [chosenValue, setChosenValue] = useState('0');
  const [inputValueAddress, setInputValueAddress] = useState('');
  const [chosenAddress, setChosenAddress] = useState('0x');
  const [errorMessage, setErrorMessage] = useState('');
  const [decryptedSecret, setDecryptedResult] = useState('???');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Conditional import based on MOCKED environment variable
        let MyConfidentialERC20;
        if (!import.meta.env.MOCKED) {
          MyConfidentialERC20 = await import(
            '@deployments/sepolia/MyConfidentialERC20.json'
          );
          console.log(
            `Using ${MyConfidentialERC20.address} for the token address on Sepolia`,
          );
        } else {
          MyConfidentialERC20 = await import(
            '@deployments/localhost/MyConfidentialERC20.json'
          );
          console.log(
            `Using ${MyConfidentialERC20.address} for the token address on Hardhat Local Node`,
          );
        }

        setContractAddress(MyConfidentialERC20.address);
      } catch (error) {
        console.error(
          'Error loading data - you probably forgot to deploy the token contract before running the front-end server:',
          error,
        );
      }
    };

    loadData();
  }, []);

  const handleConfirmAmount = () => {
    setChosenValue(inputValue);
  };

  const handleConfirmAddress = () => {
    const trimmedValue = inputValueAddress.trim().toLowerCase();
    if (ethers.isAddress(trimmedValue)) {
      // getAddress returns the checksummed address
      const checksummedAddress = ethers.getAddress(trimmedValue);
      setChosenAddress(checksummedAddress);
      setErrorMessage('');
    } else {
      setChosenAddress('0x');
      setErrorMessage('Invalid Ethereum address.');
    }
  };

  const instance = getInstance();

  const getHandleBalance = async () => {
    if (contractAddress != ZeroAddress) {
      const contract = new ethers.Contract(
        contractAddress,
        ['function balanceOf(address) view returns (uint256)'],
        provider,
      );
      const handleBalance = await contract.balanceOf(account);
      setHandleBalance(handleBalance.toString());
      setDecryptedBalance('???');
    }
  };

  useEffect(() => {
    getHandleBalance();
  }, [account, provider, contractAddress]);

  const encrypt = async (val: bigint) => {
    const now = Date.now();
    try {
      const result = await instance
        .createEncryptedInput(contractAddress, account)
        .add64(val)
        .encrypt();
      console.log(`Took ${(Date.now() - now) / 1000}s`);
      setHandles(result.handles);
      setEncryption(result.inputProof);
    } catch (e) {
      console.error('Encryption error:', e);
      console.log(Date.now() - now);
    }
  };

  const decrypt = async () => {
    const signer = await provider.getSigner();
    try {
      const clearBalance = await reencryptEuint64(
        signer,
        instance,
        BigInt(handleBalance),
        contractAddress,
      );
      setDecryptedBalance(clearBalance.toString());
    } catch (error) {
      if (error === 'Handle is not initialized') {
        // if handle is uninitialized - i.e equal to 0 - we know for sure that the balance is null
        setDecryptedBalance('0');
      } else {
        throw error;
      }
    }
  };

  const transferToken = async () => {
    const contract = new ethers.Contract(
      contractAddress,
      ['function transfer(address,bytes32,bytes) external returns (bool)'],
      provider,
    );
    const signer = await provider.getSigner();
    const tx = await contract
      .connect(signer)
      .transfer(
        chosenAddress,
        toHexString(handles[0]),
        toHexString(encryption),
      );
    await tx.wait();
    await getHandleBalance();
  };

  const decryptSecret = async () => {
    const contract = new ethers.Contract(
      contractAddress,
      ['function requestSecret() external'],
      provider,
    );
    const signer = await provider.getSigner();
    const tx = await contract.connect(signer).requestSecret();
    await tx.wait();
  };

  const refreshSecret = async () => {
    const contract = new ethers.Contract(
      contractAddress,
      ['function revealedSecret() view returns(uint64)'],
      provider,
    );
    const revealedSecret = await contract.revealedSecret();
    const revealedSecretString =
      revealedSecret === 0n ? '???' : revealedSecret.toString();
    setDecryptedResult(revealedSecretString);
  };

  return (
    <div className="bg-elementBackground rounded-lg p-6 max-w-2xl mx-auto">
      <dl className="space-y-6">
        <div>
          <dt className="text-lg font-semibold text-secondary mb-2">
            My encrypted balance is:
          </dt>
          <dd className="text-textSecondary">{handleBalance.toString()}</dd>

          <button 
            onClick={() => decrypt()}
            className="mt-2"
          >
            Reencrypt and decrypt my balance
          </button>
          <dd className="mt-2 text-textSecondary">
            My decrypted private balance is: {decryptedBalance.toString()}
          </dd>
        </div>

        <div>
          <dt className="text-lg font-semibold text-secondary mb-2">
            Choose an amount to transfer:
          </dt>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter a number"
              className="bg-background text-secondary px-3 py-2 rounded-lg border border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button onClick={handleConfirmAmount}>OK</button>
          </div>
          {chosenValue !== '0' && (
            <p className="mt-2 text-textSecondary">
              You have chosen: {chosenValue}
            </p>
          )}
          <button 
            onClick={() => encrypt(BigInt(chosenValue))}
            className="mt-2"
          >
            Encrypt {chosenValue}
          </button>
        </div>

        {handles.length > 0 && (
          <div>
            <dt className="text-lg font-semibold text-secondary mb-2">
              This is an encryption of {chosenValue}:
            </dt>
            <dd className="space-y-2">
              <pre className="bg-background p-3 rounded-lg overflow-x-auto text-textSecondary text-sm">
                Handle: {handles.length ? toHexString(handles[0]) : ''}
              </pre>
              <pre className="bg-background p-3 rounded-lg overflow-x-auto text-textSecondary text-sm">
                Input Proof: {encryption ? toHexString(encryption) : ''}
              </pre>
            </dd>
          </div>
        )}

        <div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={inputValueAddress}
              onChange={(e) => setInputValueAddress(e.target.value)}
              placeholder="Recipient address"
              className="flex-1 bg-background text-secondary px-3 py-2 rounded-lg border border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button onClick={handleConfirmAddress}>OK</button>
          </div>
          {chosenAddress !== '0x' && (
            <p className="mt-2 text-textSecondary">
              Chosen recipient address: {chosenAddress}
            </p>
          )}
          {errorMessage && (
            <p className="mt-2 text-red-500">
              {errorMessage}
            </p>
          )}
        </div>

        {chosenAddress !== '0x' && encryption && encryption.length > 0 && (
          <div>
            <button 
              onClick={transferToken}
              className="w-full bg-primary hover:bg-primaryHover"
            >
              Transfer Encrypted Amount to Recipient
            </button>
          </div>
        )}

        <div className="space-y-2">
          <button 
            onClick={decryptSecret} 
            disabled={decryptedSecret !== '???'}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Request Secret Decryption
          </button>
          <dd className="text-textSecondary">
            The decrypted secret value is: {decryptedSecret}{' '}
            <button
              onClick={refreshSecret}
              disabled={decryptedSecret !== '???'}
              className="ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refresh Decrypted Secret
            </button>
          </dd>
        </div>
      </dl>
    </div>
  );
};
