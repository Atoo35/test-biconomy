import './App.css';
import logo from './logo.svg';
import { useCallback, useEffect, useState } from 'react';
import SocialLogin from "@biconomy/web3-auth";
import { ChainId } from '@biconomy/core-types'
import { ethers } from 'ethers';
import SmartAccount from '@biconomy/smart-account';

function App () {
  const [socialLoginSdk, setSocialLoginSdk] = useState(null);
  const [address, setAddress] = useState(null);
  const [smartAccount, setSmartAccount] = useState(null);
  const nftAddress = "0xc38db2341bf380bb2bc5f67e74420c1bfb991c6e"
  const connectWallet = useCallback(async () => {
    if (address) return;
    if (socialLoginSdk?.provider) {
      // await socialLoginSdk.showWallet()
      console.info('socialLoginSdk provider', socialLoginSdk)
      const web3Provider = new ethers.providers.Web3Provider(
        socialLoginSdk.web3auth.provider,
      );
      console.info('web3Provider', web3Provider)
      const signer = web3Provider.getSigner();
      const gotAccount = await signer.getAddress();
      // setAddress(gotAccount);
      const network = await web3Provider.getNetwork();
      console.table({ signer, gotAccount, network });
      console.info('userInfo', await socialLoginSdk.getUserInfo())

      let options = {
        activeNetworkId: ChainId.POLYGON_MUMBAI,
        supportedNetworkIds: [ChainId.POLYGON_MUMBAI],
        networkConfig: [{
          chainId: ChainId.POLYGON_MUMBAI,
          dappAPIKey: process.env.REACT_APP_BICONOMY_API_KEY,
        }]
      }
      let smartAccount = new SmartAccount(web3Provider, options);
      smartAccount = await smartAccount.init();
      // console.log('accountState', await smartAccount.getSmartAccountState());  //contains isDeployed
      // console.log(smartAccount)
      const smartAccountAddress = await smartAccount.address;
      setAddress(smartAccountAddress);
      setSmartAccount(smartAccount);


      //---------Listening to events----------------
      smartAccount.on('txHashGenerated', (response) => {
        console.log('txHashGenerated event received in AddLP via emitter', response);
      });

      smartAccount.on('txHashChanged', (response) => {
        console.log('txHashChanged event received in AddLP via emitter', response);
      });

      smartAccount.on('txMined', (response) => {
        console.log('txMined event received in AddLP via emitter', response);
      });

      smartAccount.on('error', (response) => {
        console.log('error event received in AddLP via emitter', response);
      });

      // get all smart account versions available and update in state
      const { data } = await smartAccount.getSmartAccountsByOwner({
        chainId: options.activeNetworkId,
        owner: address || gotAccount,
      });
      console.info("getSmartAccountsByOwner", data);
      // socialLoginSdk.hideWallet()
      return
    }
    if (socialLoginSdk) {
      socialLoginSdk.showWallet()
      return;
    }
    const socialLogin = new SocialLogin();
    const signature = await socialLogin.whitelistUrl('http://localhost:3000');
    console.log('signature', signature)
    await socialLogin.init(ethers.utils.hexValue(80001), {
      'http://localhost:3001': signature
    });    // Enter the network id in init() parameter
    socialLogin.showConnectModal();
    setSocialLoginSdk(socialLogin);
    socialLogin.showWallet()
  }, [address, socialLoginSdk])

  const disconnect = async () => {
    if (socialLoginSdk) {
      // socialLoginSdk.hideWallet()
      console.log('wtf', socialLoginSdk)
      setSocialLoginSdk(null)
      setAddress(null);
      socialLoginSdk.logout()
    }
  }

  const mint = async () => {
    if (smartAccount && address) {
      const erc1155Interface = new ethers.utils.Interface([
        'function mint(address account, uint256 id, uint256 amount, bytes memory data)'
      ])
      const data = erc1155Interface.encodeFunctionData(
        'mint', [address, 1, 1, '0x']
      )
      const tx1 = {
        to: nftAddress,
        data
      }
      console.log('smartAccountAddress', address)

      const txResponse = await smartAccount.sendGasLessTransaction({ transaction: tx1 });
      console.log('txResponse', txResponse)
    }
  }

  useEffect(() => {
    if (socialLoginSdk && address) {
      console.log("hidewallet");
      socialLoginSdk.hideWallet();
    }
  }, [address, socialLoginSdk]);

  useEffect(() => {
    const initSocialLogin = async () => {
      if (!socialLoginSdk) {

        const socialLogin = new SocialLogin();
        const signature = await socialLogin.whitelistUrl('http://localhost:3000');
        console.log('signature', signature)
        await socialLogin.init(ethers.utils.hexValue(80001), {
          'http://localhost:3001': signature
        });    // Enter the network id in init() parameter
        socialLogin.showConnectModal();
        setSocialLoginSdk(socialLogin);
      }
    }
    if (!socialLoginSdk) initSocialLogin()
  }, [socialLoginSdk]);

  useEffect(() => {
    (async () => {
      if (socialLoginSdk?.provider && !address) {
        connectWallet();
      }
    })();
  }, [address, connectWallet, socialLoginSdk, socialLoginSdk?.provider]);


  useEffect(() => {
    const interval = setInterval(async () => {
      if (address) {
        clearInterval(interval);
      }
      if (socialLoginSdk?.provider && !address) {
        connectWallet();
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [address, connectWallet, socialLoginSdk]);

  return (
    <div className="App">
      <header className="App-header">
        {socialLoginSdk && address ?
          <div>
            <button onClick={disconnect}>Disconnect</button>
            <button onClick={mint}>Mint SBT</button>
          </div> :
          <button onClick={connectWallet}>Connect Wallet</button>
        }


        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
